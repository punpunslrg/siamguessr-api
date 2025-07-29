import prisma from "../config/prisma.config.js";

export const getRoundResult = async (roundId) => {
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: {
      location: { select: { id: true, lat: true, lng: true, description: true } },
      guesses: {
        include: {
          user: { select: { id: true, username: true } }
        }
      }
    }
  });

  if (!round) return null;

  return {
    roundId: round.id,
    roundNumber: round.roundNumber,
    location: round.location,
    guesses: round.guesses.map(g => ({
      userId: g.userId,
      username: g.user.username,
      guessedLat: g.guessedLat,
      guessedLng: g.guessedLng,
      distance: g.distance, // (ควรคำนวณแล้วเก็บใน db ตอน submit guess)
      score: g.score
    }))
  };
};

export const startNextRound = async (roomId) => {
  // 1. หารอบที่ยังไม่เริ่ม (หรือ next roundNumber)
  const nextRound = await prisma.round.findFirst({
    where: {
      roomId,
      endedAt: null // ยังไม่จบ
    },
    orderBy: { roundNumber: 'asc' }
  });

  if (!nextRound) return null;

  // 2. (option) update อะไรเพิ่มถ้าต้องการ mark as started

  // 3. return ข้อมูลรอบใหม่
  return {
    id: nextRound.id,
    roundNumber: nextRound.roundNumber,
    roomId: nextRound.roomId,
    location: await prisma.curatedLocation.findUnique({
      where: { id: nextRound.locationId },
      select: { id: true, lat: true, lng: true, description: true }
    }),
    startedAt: nextRound.createdAt
  };
};
