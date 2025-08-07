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
import paymentRoute from "./routes/payment.route.js";
import { stripeWebhookHandler } from "./controllers/stripe/webhook.controller.js";
import socketServer from "./socket.server.js";
import { startLeaderboardCron } from "./cron/leaderboard.cron.js";

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
    // origin: ["http://localhost:5173", "http://localhost:5174"],
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// กำหนด Webhook Route ที่นี่ ก่อน Middleware ตัวอื่น
app.post(
  '/api/payment/stripe-webhook', 
  express.raw({ type: 'application/json' }), 
  stripeWebhookHandler
);


const csrfProtection = csrf({ 
  cookie: true,
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
});

// ปิด CSRF protection ชั่วคราว
// app.use(csrfProtection);

app.get('/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});


app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/friends", friendRoute);
app.use("/api/rooms", roomRoute);
app.use("/api/rounds", roundRoute);
app.use("/api/guess", guessRoute);
app.use("/api/game", gameRoute);
app.use("/api/leaderboard", leaderboardRoute);
app.use("/api/payment", paymentRoute);

startLeaderboardCron();
socketServer(io);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

httpServer.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

export default app;
