import prisma from "../config/prisma.config.js";

// Calculate average of top 5 scores for all users
export const generateLeaderboard = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        gameScoreHistory: {
          some: {},
        },
      },
      include: {
        gameScoreHistory: {
          orderBy: { score: "desc" },
        },
      },
    });

    const difficulties = ["classic", "challenge"];
    const defaultModeForUpsert = "single";

    for (const user of users) {
      for (const difficulty of difficulties) {
        const topScores = user.gameScoreHistory
          .filter((g) => g.difficulty === difficulty)
          .map((g) => g.score)
          .slice(0, 5);

        if (topScores.length < 5) continue;

        const averageTop5 = Math.round(
          topScores.reduce((a, b) => a + b, 0) / topScores.length
        );

        const totalGames = await prisma.gameScoreHistory.count({
          where: { userId: user.id, difficulty },
        });

        await prisma.leaderboard.upsert({
          where: {
            userId_mode_difficulty: {
              userId: user.id,
              mode: defaultModeForUpsert,
              difficulty,
            },
          },
          update: {
            averageTop5,
            totalGames,
          },
          create: {
            userId: user.id,
            averageTop5,
            totalGames,
            mode: defaultModeForUpsert,
            difficulty,
          },
        });
      }
    }

    return res
      ?.status?.(201)
      ?.json?.({ message: "Leaderboard updated successfully" });
  } catch (error) {
    console.error("Generate leaderboard error:", error);
    return res
      ?.status?.(500)
      ?.json?.({ message: "Failed to update leaderboard" });
  }
};

export const getLeaderboard = async (req, res, next) => {
  try {
    const { mode = "single", difficulty = "classic" } = req.query;

    const leaderboard = await prisma.leaderboard.findMany({
      where: { mode, difficulty },
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

    return res.status(200).json({
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
    console.error("Get leaderboard error:", error);
    return res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
};
