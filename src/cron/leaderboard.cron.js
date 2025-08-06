import cron from "node-cron"
import { generateLeaderboard } from "../controllers/leaderboard.controller.js";

export const startLeaderboardCron = () => {
  cron.schedule("*/1 * * * *", async () => {
    console.log("⏰ Generating leaderboard every 1 minutes...");
    try {
      await generateLeaderboard({
        query: {},  // mock request with empty query
      }, {
        status: () => ({ json: () => {} })  // mock response object
      });
    } catch (err) {
      console.error("Cron leaderboard generation failed:", err);
    }
  });
};
