import express from "express";

const roomRoute = express.Router();

roomRoute.get("/", (req, res, next) => {
  res.status(200).json({ mesaage: "get me path" });
});

roomRoute.post("/", (req, res, next) => {
  res.status(200).json({ mesaage: "put me path" });
});

roomRoute.get("/:roomId", (req, res, next) => {
  res.status(200).json({ mesaage: "put me path" });
});

roomRoute.post("/:roomId/join", (req, res, next) => {
  res.status(200).json({ mesaage: "put me path" });
});


export default roomRoute;
