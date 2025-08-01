import express from "express";
import * as roomController from "../controllers/room.controller.js";
import { authCheck } from "../middlewares/auth.middleware.js";
const roomRoute = express.Router();

// Creates a new game room. Returns the new room's ID.
roomRoute.post("/", authCheck, roomController.createRoom);

// Join ห้องด้วย roomId หรือ code
roomRoute.post("/:roomId/join", authCheck, roomController.joinRoom);

// ดูข้อมูลห้อง, รายชื่อ player
roomRoute.get("/:roomId", roomController.getRoom);

// Leave Room
roomRoute.post("/:roomId/leave", authCheck, roomController.leaveRoom);

// Host start game
roomRoute.post("/:roomId/start", authCheck, roomController.startRoom);

// ready and waiting
roomRoute.patch(
  "/:roomId/players/me",
  authCheck,
  roomController.updatePlayerStatus
);

// เช็คดูแต่ละ round
roomRoute.get(
  "/:roomId/current-round",
  authCheck,
  roomController.getCurrentRound
);

roomRoute.get("/:roomId/results", roomController.getRoomResults)

roomRoute.get("/:roomId/rounds", (req, res, next) => {
  res.status(200).json({ mesaage: "ประวัติรอบทั้งหมดของห้อง" });
});

export default roomRoute;
