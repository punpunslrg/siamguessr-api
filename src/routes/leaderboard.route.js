import express from "express";
import { generateLeaderboard } from "../controllers/leaderboard.controller.js";

const leaderboardRoute = express.Router();

leaderboardRoute.post("/generate", generateLeaderboard);

export default leaderboardRoute;
