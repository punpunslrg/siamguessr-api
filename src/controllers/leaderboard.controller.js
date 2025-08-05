import prisma from "../config/prisma.config.js";
import createError from "../utils/create-error.util.js";

// Calculate average of top 5 scores for all users
export const generateLeaderboard = async (req, res, next) => {
  try {
    // Get all users who have GameScoreHistory
    const users = await prisma.user.findMany({
      where: {
        gameScoreHistory: {
          some: {}, // required for join
        },
      },
      include: {
        _count: {
          select: { gameScoreHistory: true },
        },
        gameScoreHistory: {
          orderBy: { score: "desc" },
          take: 5,
        },
      },
    });

    // Loop and calculate leaderboard entries
    for (const user of users) {
      if (user._count.gameScoreHistory < 5) continue;
      const topScores = user.gameScoreHistory.map((g) => g.score);
      const totalGames = await prisma.gameScoreHistory.count({
        where: { userId: user.id },
      });

      const averageTop5 =
        topScores.length > 0
          ? Math.round(topScores.reduce((a, b) => a + b, 0) / topScores.length)
          : 0;
      console.log("averageTop5", averageTop5);
      // Upsert (create or update) leaderboard
      await prisma.leaderboard.upsert({
        where: { userId: user.id },
        update: {
          averageTop5,
          totalGames,
        },
        create: {
          userId: user.id,
          averageTop5,
          totalGames,
        },
      });
    }

    const leaderboard = await prisma.leaderboard.findMany({
      orderBy: { averageTop5: "desc" },
      include: {
        user: {
          select: {
            username: true,
            image: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Leaderboard updated successfully",
      leaderboard: leaderboard.map((entry, idx) => ({
        rank: idx + 1,
        userId: entry.userId,
        username: entry.user?.username || "Unknown",
        image: entry.user?.image || null,
        averageTop5: entry.averageTop5,
        totalGames: entry.totalGames,
      })),
    });
  } catch (error) {
    createError(500, "Failed to update leaderboard");
  }
};
