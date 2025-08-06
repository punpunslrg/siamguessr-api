import express from "express";
import { generateLeaderboard, getLeaderboard } from "../controllers/leaderboard.controller.js";

const leaderboardRoute = express.Router();

leaderboardRoute.post("/generate", generateLeaderboard);
leaderboardRoute.get("/", getLeaderboard);

export default leaderboardRoute;
