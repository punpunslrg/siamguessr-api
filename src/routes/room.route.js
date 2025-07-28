import express from "express";
import * as roomController from "../controllers/room.controller.js";
import { authCheck } from "../middlewares/auth.middleware.js";
const roomRoute = express.Router();

// Creates a new game room. Returns the new room's ID.
roomRoute.post("/",authCheck ,roomController.createRoom);

// Join ห้องด้วย roomId หรือ code
roomRoute.post("/:roomId/join", (req, res, next) => {
  res.status(200).json({ mesaage: "put me path" });
});

// Leave Room
roomRoute.post("/:roomId/leave",(req,res,next)=>{
  res.status(200).json({ mesaage: "put me path" });
})

// ดูข้อมูลห้อง, รายชื่อ player
roomRoute.get("/:roomId",(req,res,next)=>{
  res.status(200).json({ mesaage: "put me path" });
})

// Host start game
roomRoute.get("/:roomId/start",(req,res,next)=>{
  res.status(200).json({ mesaage: "put me path" });
})

export default roomRoute;
