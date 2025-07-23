import express from "express";

const authRoute = express.Router();

authRoute.post("/login", (req, res, next) => {
  res.status(200).json({ mesaage: "login path" });
});
authRoute.post("/register", (req, res, next) => {
  res.status(200).json({ mesaage: "register path" });
});

authRoute.get("/google", (req, res, next) => {
  res.status(200).json({ mesaage: "google path" });
});
authRoute.get("/google/callback", (req, res, next) => {
  res.status(200).json({ mesaage: "google callback path" });
});

authRoute.get("/facebook", (req, res, next) => {
  res.status(200).json({ mesaage: "facebook path" });
});
authRoute.get("/facebook/callback", (req, res, next) => {
  res.status(200).json({ mesaage: "facebook callback path" });
});

export default authRoute;
