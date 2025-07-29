import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import errorMiddleware from "./middlewares/error.middleware.js";
import notFoundMiddleware from "./middlewares/not-found.middleware.js";
import authRoute from "./routes/auth.route.js";
import userRoute from "./routes/user.route.js";
import friendRoute from "./routes/friend.route.js";
import roomRoute from "./routes/room.route.js";
import gameRoute from "./routes/game.route.js";
import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";
<<<<<<< HEAD
import leaderboardRoute from "./routes/leaderboard.route.js";
import http from "http";
=======
import roundRoute from "./routes/round.route.js";
import guessRoute from "./routes/guess.route.js";
>>>>>>> ab57617c7bf0a705a879296d8c92f61afad9e9c4

dotenv.config();

const PORT = process.env.PORT || 8890;
const app = express();
const httpServer = createServer(app);

// app.use(
//   cors({
//     origin: ["http://localhost:5173", "http://localhost:5174"],
//   })
// );

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
  },
});

const rooms = {}; // Store active rooms in memory

io.on("connection", (socket) => {
  console.log(`⚡ User connected: ${socket.id}`);

  // --- CREATE ROOM ---
  socket.on("create-room", ({ username }, callback) => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = {
      players: [{ id: socket.id, username, ready: false }],
      hostId: socket.id,
    };
    socket.join(roomCode);
    callback({ roomCode }); // Send back the code
    io.to(roomCode).emit("update-room", rooms[roomCode]);
  });

  // --- JOIN ROOM ---
  socket.on("join-room", ({ roomCode, username }, callback) => {
    const room = rooms[roomCode];
    if (!room) return callback({ error: "Room not found" });

    room.players.push({ id: socket.id, username, ready: false });
    socket.join(roomCode);
    callback({ success: true });
    io.to(roomCode).emit("update-room", room);
  });

  // --- READY TO START ---
  socket.on("toggle-ready", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const player = room.players.find((p) => p.id === socket.id);
    if (player) {
      player.ready = !player.ready;
      io.to(roomCode).emit("update-room", room);
    }
  });

  // --- DISCONNECT ---
  socket.on("disconnect", () => {
    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      room.players = room.players.filter((p) => p.id !== socket.id);
      if (room.players.length === 0) {
        delete rooms[roomCode]; // Clean up empty room
      } else {
        io.to(roomCode).emit("update-room", room);
      }
    }
    console.log(`🚫 User disconnected: ${socket.id}`);
  });
});

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/friends", friendRoute);
app.use("/api/rooms", roomRoute);
app.use("/api/rounds", roundRoute)
app.use("/api/guess", guessRoute)
app.use("/api/game", gameRoute);
app.use("/api/leaderboard", leaderboardRoute);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

httpServer.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

export default app;
