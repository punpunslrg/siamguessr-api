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

dotenv.config();

const PORT = process.env.PORT || 8890;
const app = express();
const httpServer = createServer(app);
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
  })
);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
  },
});

app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/friends", friendRoute);
app.use("/api/rooms", roomRoute);
app.use("/api/game", gameRoute);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

httpServer.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

export default app;
