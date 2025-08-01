import jwt from "jsonwebtoken";
import prisma from "./config/prisma.config.js";

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
      console.log("status", status);
      console.log("roomName", roomName);
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
      });
      // console.log('player', player)
      io.to(roomName).emit("playersData", player);
    });
    socket.on("joinRoom", async ({ roomName, room }) => {
      const existPlayer = await prisma.roomPlayer.findFirst({
        where: {
          userId: socket.user.id,
          room: {
            code: roomName,
          },
        },
      });
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
            roomId: room.id
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
      });
      console.log("player", player);
      io.to(roomName).emit("playersData", player);
    });
  });
}
