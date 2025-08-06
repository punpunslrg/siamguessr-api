import prisma from "../config/prisma.config.js";

export const getSingleplayerHistoryForUser = async (userId) => {
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

export const getMultiplayerHistoryForUser = async (userId) => {
  const history = await prisma.gameScoreHistory.findMany({
    where: {
      userId: userId,
      room: {
        mode: "multi", // กรองเฉพาะห้องที่มีโหมด 'multi'
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
