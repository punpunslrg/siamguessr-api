import jwt from "jsonwebtoken";
import prisma from "./config/prisma.config.js";
import createError from "./utils/create-error.util.js";

const roomInfo = {};

export default function socketServer(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      next(new Error("Error ja mom"));
      return;
    }
    const payload = jwt.verify(token, process.env.SECRET);
    socket.user = payload;
    // console.log("payload", payload);
    next();
  });

  io.on("connection", (socket) => {
    socket.on("changeStatus", async ({ status, roomName }) => {
      // console.log("status", status);
      // console.log("roomName", roomName);
      await prisma.roomPlayer.updateMany({
        where: {
          userId: socket.user.id,
          room: {
            code: roomName,
          },
        },
        data: { status },
      });
      const player = await prisma.roomPlayer.findMany({
        where: {
          room: {
            code: roomName,
          },
        },
        include: {
          user: {
            select: {
              username: true,
              image: true,
            },
          },
        },
      });
      // console.log('playerChangeStatus', player)
      io.to(roomName).emit("playersData", player);
    });
    socket.on("joinRoom", async ({ roomName, room }) => {
      const existPlayer = await prisma.roomPlayer.findFirst({
        where: {
          userId: socket.user.id,
          roomId: room.id,
        },
      });
      // console.log('existPlayer', existPlayer)
      if (!existPlayer) {
        const countPlayer = await prisma.roomPlayer.count({
          where: {
            room: {
              code: roomName,
            },
          },
        });
        if (countPlayer >= 2) {
          return socket.emit("error", { message: "Lobby is full" });
        }
        await prisma.roomPlayer.create({
          data: {
            userId: socket.user.id,
            roomId: room.id,
            status: "waiting",
          },
        });
      }
      socket.join(roomName);
      const player = await prisma.roomPlayer.findMany({
        where: {
          room: {
            code: roomName,
          },
        },
        include: {
          user: {
            select: {
              username: true,
              image: true,
            },
          },
        },
      });
      console.log("player", player);
      io.to(roomName).emit("playersData", player);
    });
    socket.on("leaveRoom", async (room) => {
      const playerLeaveRoom = await prisma.roomPlayer.findFirst({
        where: {
          userId: socket.user.id,
          roomId: room.id,
        },
      });
      if (playerLeaveRoom.isHost) {
        await prisma.room.delete({
          where: {
            id: room.id,
          },
        });
        io.to(room.code).emit("leaveRoom", {});
        return;
      }
      await prisma.roomPlayer.deleteMany({
        where: {
          userId: socket.user.id,
          roomId: room.id,
        },
      });
      const player = await prisma.roomPlayer.findMany({
        where: {
          roomId: room.id,
        },
        include: {
          user: {
            select: {
              username: true,
              image: true,
            },
          },
        },
      });
      // console.log("player", player);
      io.to(room.code).emit("playersData", player);
      socket.emit("leaveRoom", {});
      socket.leave(room.code);
    });

    socket.on("startgame", async (room) => {
      console.log('room at startgame', room)
      const existRoom = await prisma.room.findFirst({
        where: {
          id: room.id
        }
      });
      if (!existRoom) {
        createError(401, "ไม่มีห้องจ้า");
      }
      const players = await prisma.roomPlayer.findMany({
        where: { roomId: room.id },
      });
      const readyPlayers = await prisma.roomPlayer.findMany({
        where: { roomId: room.id, status: "ready" },
      });
      const isEveryoneReady =
        players.length > 0 && readyPlayers.length === players.length;

      if (!isEveryoneReady) {
        createError(400, "ยังมีคนไม่พร้อม");
      }
      const startedAt = new Date();
      const endedAt = new Date(Date.now() + 90 * 1000);
      await prisma.room.update({
        where: { id: room.id },
        data: { status: "playing" },
      });
      await prisma.round.updateMany({
        where: { roomId: room.id, roundNumber: 1 },
        data: { startedAt, endedAt },
      });
      const updatedRoom = await prisma.room.findUnique({
        where: { id: room.id },
        include: {
          players: { include: { user: { select: { username: true, image: true } } } },
          rounds: {
            include: {
              location: {
                select: {
                  id: true,
                  lat: true,
                  lng: true,
                  description: true,
                },
              },
            },
          },
        },
      });
      io.to(room.code).emit("gameStarted", updatedRoom);
    });
  });
}
