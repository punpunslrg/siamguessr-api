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
import leaderboardRoute from "./routes/leaderboard.route.js";
import roundRoute from "./routes/round.route.js";
import guessRoute from "./routes/guess.route.js";
import passport from "passport";
import session from 'express-session';
import cookieParser from 'cookie-parser';
import './config/passport.js'; // ⬅️ import passport config
import csrf from "csurf";

dotenv.config();

const PORT = process.env.PORT || 8890;
const app = express();
const httpServer = createServer(app);

// require("./passport"); // ⬅️ ต้อง import ก่อนใช้ passport.authenticate

app.use(session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', 
        httpOnly: true,
    }
}));


app.use(cookieParser())
app.use(passport.initialize());
app.use(passport.session());

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true, // เพื่อให้ส่ง cookies ได้
  })
);

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


const csrfProtection = csrf({ 
  cookie: true,
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
});

// ใช้ CSRF แต่ยกเว้น OAuth routes และ register/login
app.use((req, res, next) => {
  if (req.path.startsWith('/api/auth/google') || 
      req.path.startsWith('/api/auth/facebook') ||
      req.path === '/api/auth/register' ||
      req.path === '/api/auth/login') {
    return next();
  }
  csrfProtection(req, res, next);
});

app.get('/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});


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
