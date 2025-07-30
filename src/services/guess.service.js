import prisma from "../config/prisma.config.js";

export const submitGuess = async ({ roundId, userId, guess, distance, score }) => {
  // 1. เช็คว่ามี guess ของ user ในรอบนี้อยู่แล้วหรือยัง
  const exist = await prisma.guess.findUnique({
    where: { roundId_userId: { roundId, userId } }
  });
  if (exist) throw new Error("ALREADY_GUESSED");

  // 2. สร้าง guess
  const newGuess = await prisma.guess.create({
    data: {
      roundId,
      userId,
      guessedLat: +guess.lat,
      guessedLng: +guess.lng,
      distance,
      score,
      guessedAt: new Date()
    }
  });
  return newGuess;
};
