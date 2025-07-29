import express from "express";
import * as roomController from "../controllers/room.controller.js";
import { authCheck } from "../middlewares/auth.middleware.js";
const roomRoute = express.Router();

// Creates a new game room. Returns the new room's ID.
roomRoute.post("/",authCheck ,roomController.createRoom);

// Join ห้องด้วย roomId หรือ code
roomRoute.post("/:roomId/join",authCheck, roomController.joinRoom );

// ดูข้อมูลห้อง, รายชื่อ player
roomRoute.get("/:roomId",roomController.getRoom);

// Leave Room
roomRoute.post("/:roomId/leave",authCheck,roomController.leaveRoom)

// Host start game
roomRoute.post("/:roomId/start",authCheck, roomController.startRoom);
  
roomRoute.get("/:roomId/current-round",(req,res,next)=>{
  res.status(200).json({ mesaage: "ดึงข้อมูลรอบปัจจุบัน" });
})

roomRoute.post("/:roomId/rounds/:roundId/guess",(req,res,next)=>{
  res.status(200).json({ mesaage: "ส่งคำตอบ user lat/lng" });
})

roomRoute.get("/:roomId/rounds/:roundId/guesses",(req,res,next)=>{
  res.status(200).json({ mesaage: "admin/host ดูคำตอบทุกคน (หรือเฉลยตอนจบ)" });
})

roomRoute.get("/:roomId/rounds",(req,res,next)=>{
  res.status(200).json({ mesaage: "ประวัติรอบทั้งหมดของห้อง" });
})

export default roomRoute;
