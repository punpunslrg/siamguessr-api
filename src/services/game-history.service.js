import prisma from "../config/prisma.config.js";

export const getSingleplayerHistory = async (userId) => {
  const history = await prisma.gameScoreHistory.findMany({
    where: {
      userId: userId,
      room: {
        mode: "single", // กรองเฉพาะห้องที่มีโหมด 'single'
      },
    },
    include: {
      // ดึงข้อมูลห้องที่เกี่ยวข้องมาด้วย เพื่อแสดงชื่อ Map หรือ Difficulty
      room: {
        select: {
          difficulty: true,
        },
      },
    },
    orderBy: {
      playedAt: "desc", // เรียงจากล่าสุดไปเก่าสุด
    },
  });
  return history;
};

export const getMultiplayerHistory = async (userId) => {
  const history = await prisma.gameScoreHistory.findMany({
    where: {
      userId: userId,
      room: { mode: "multi" },
    },
    select: {
      score: true,
      rank: true, // ✅ เอา rank มาด้วย
      playedAt: true,
      room: {
        select: {
          difficulty: true,
        },
      },
      user: {
        select: {
          winRate: true,
        },
      },
    },
    orderBy: {
      playedAt: "desc",
    },
  });
  return history;
};
