import express from "express";
import * as roomController from "../controllers/room.controller.js";
import { authCheck } from "../middlewares/auth.middleware.js";
const roomRoute = express.Router();

// Fetches a list of all public, joinable rooms for the lobby.
roomRoute.get("/", (req, res, next) => {
  res.status(200).json({ mesaage: "get me path" });
});

// Creates a new game room. Returns the new room's ID.
roomRoute.post("/",authCheck ,roomController.createRoom);

// Fetches the details of a specific game room.
roomRoute.get("/:roomId", (req, res, next) => {
  res.status(200).json({ mesaage: "put me path" });
});

// Allows the current user to join a specific room.
roomRoute.post("/:roomId/join", (req, res, next) => {
  res.status(200).json({ mesaage: "put me path" });
});


export default roomRoute;
