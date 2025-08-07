import jwt from "jsonwebtoken";
import prisma from "./config/prisma.config.js";
import createError from "./utils/create-error.util.js";
import { getRoom, getRoomResults } from "./services/room.service.js";

const connectedPlayers = new Map();
const disconnectTimers = new Map();

export default function socketServer(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    console.log(token)
    if (!token) {
      next(new Error("Error ja mom"));
      return;
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = payload;
    console.log("payload", payload);
    next();
  });

  io.on("connection", (socket) => {
    if (disconnectTimers.has(socket.user.id)) {
      console.log("reconnected");
      clearTimeout(disconnectTimers.get(socket.user.id));
      disconnectTimers.delete(socket.user.id);
    }
    socket.on("disconnect", () => {
      const timer = setTimeout(async () => {
        try {
          console.log("💀 Disconnected:", socket.user?.id);

          const roomPlayers = await prisma.roomPlayer.findMany({
            where: { userId: socket.user.id },
          });

          for (const player of roomPlayers) {
            const room = await prisma.room.findUnique({
              where: { id: player.roomId },
            });

            await prisma.roomPlayer.deleteMany({
              where: {
                userId: socket.user.id,
                roomId: player.roomId,
              },
            });

            if (player.isHost) {
              await prisma.room.delete({ where: { id: player.roomId } });
              io.to(room.code).emit("leaveRoom", {});
            }

            const updatedPlayers = await prisma.roomPlayer.findMany({
              where: { roomId: player.roomId },
              include: {
                user: { select: { username: true, image: true } },
              },
            });

            if (room) {
              io.to(room.code).emit("playersData", updatedPlayers);
              io.to(room.code).emit("playerDisconnect", updatedPlayers);
            }
          }
        } catch (err) {
          console.error("Error on disconnect cleanup:", err);
        }
      }, 10000); // Wait 10 seconds before cleanup

      disconnectTimers.set(socket.user.id, timer);
    });

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
      connectedPlayers.set(socket.id, { userId: socket.user.id, roomName });

      // ✅ Check if room still exists (host might have left)
      const currentRoom = await prisma.room.findUnique({
        where: { id: room.id },
      });

      if (!currentRoom) {
        return socket.emit("leaveRoom", {}); // trigger client to go back
      }

      const existPlayer = await prisma.roomPlayer.findFirst({
        where: {
          userId: socket.user.id,
          roomId: room.id,
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

        try {
          await prisma.roomPlayer.upsert({
            where: {
              userId_roomId: {
                userId: socket.user.id,
                roomId: room.id,
              },
            },
            update: {}, // do nothing if exists
            create: {
              userId: socket.user.id,
              roomId: room.id,
              status: "waiting",
            },
          });
        } catch (err) {
          if (err.code === "P2002") {
            // Player already exists, maybe rejoining — just continue
          } else {
            throw err; // Rethrow other errors
          }
        }
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

      io.to(roomName).emit("playersData", player);
    });

    socket.on("leaveRoom", async (room) => {
      // console.log("room from server", room)
      const newRoom = await getRoom(room.id)
      // console.log('newRoom', newRoom)
      const playerLeaveRoom = await prisma.roomPlayer.findFirst({
        where: {
          userId: socket.user.id,
          roomId: newRoom.id,
        },
      });
      
      if (!playerLeaveRoom) return; 
      
      if (playerLeaveRoom.isHost && newRoom.status !== "finished") {
        await prisma.room.delete({ where: { id: newRoom.id } });
        
        io.to(newRoom.code).emit("leaveRoom", {}); 
        socket.emit("leaveRoom", {});
        return;
      }
      
      await prisma.roomPlayer.deleteMany({
        where: {
          userId: socket.user.id,
          roomId: newRoom.id,
        },
      });
      
      const updatedPlayers = await prisma.roomPlayer.findMany({
        where: {
          roomId: newRoom.id,
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
      socket.leave(newRoom.code);
      
      io.to(newRoom.code).emit("playersData", updatedPlayers);
      socket.emit("leaveRoom", {}); 
    });

    socket.on("startgame", async (room) => {
      // console.log("room at startgame", room);
      const existRoom = await prisma.room.findFirst({
        where: {
          id: room.id,
        },
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
          players: {
            include: { user: { select: { username: true, image: true } } },
          },
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

    socket.on("playerGuessed", async (guessed) => {
      // console.log("guessed", guessed);
      await prisma.guess.upsert({
        where: {
          roundId_userId: {
            roundId: guessed.roundId,
            userId: socket.user.id,
          },
        },
        update: {
          guessedLat: guessed.guess.lat,
          guessedLng: guessed.guess.lng,
          distance: guessed.distance,
          score: guessed.score,
        },
        create: {
          userId: socket.user.id,
          roundId: guessed.roundId,
          guessedLat: guessed.guess.lat,
          guessedLng: guessed.guess.lng,
          distance: guessed.distance,
          score: guessed.score,
        },
      });

      const allGuessed = await prisma.guess.findMany({
        where: {
          roundId: guessed.roundId,
        },
      });
      const round = await prisma.round.findUnique({
        where: { id: guessed.roundId },
        include: {
          room: {
            include: {
              players: true,
              // code: true,
            },
          },
        },
      });
      const numPlayers = round?.room?.players?.length || 0;
      // ถ้าผู้เล่นทุกคนทายครบ
      if (allGuessed.length === numPlayers && numPlayers > 0) {
        // console.log("allGuessed", allGuessed);
        io.to(round.room.code).emit("allGuessed", allGuessed);
      }
    });

    socket.on("nextRoundStarted", ({ roomCode, round, currentRoundIndex }) => {
      console.log("nextRoundStarted")
      socket
        .to(roomCode)
        .emit("nextRoundStarted", { round, currentRoundIndex });
    });

    socket.on("gamebreakdown", async ({room}) => {
      const roomResult = await getRoomResults(room.id)
      // console.log('roomResult', roomResult)
      io.to(room.code).emit("game-finished", {roomResult : roomResult.results})
    })
  });
}
