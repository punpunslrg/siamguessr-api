import express from "express";

const userRoute = express.Router();

userRoute.get("/me", (req, res, next) => {
  res.status(200).json({ mesaage: "get me path" });
});
userRoute.post("/me", (req, res, next) => {
  res.status(200).json({ mesaage: "put me path" });
});

export default userRoute;
