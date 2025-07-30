import prisma from "../config/prisma.config.js";

export const getRoundResult = async (roundId) => {
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: {
      location: {
        select: { id: true, lat: true, lng: true, description: true },
      },
      guesses: {
        include: {
          user: { select: { id: true, username: true } },
        },
      },
    },
  });

  if (!round) return null;

  return {
    roundId: round.id,
    roundNumber: round.roundNumber,
    location: round.location,
    guesses: round.guesses.map((g) => ({
      userId: g.userId,
      username: g.user.username,
      guessedLat: g.guessedLat,
      guessedLng: g.guessedLng,
      distance: g.distance, // (ควรคำนวณแล้วเก็บใน db ตอน submit guess)
      score: g.score,
    })),
  };
};

export const startNextRound = async (roundId) => {
  const round = await prisma.round.findUnique({
    where: { id: roundId },
  });

  if (!round || round.startedAt !== null) return null; // already started or not found

  const now = new Date();
  const endedAt = new Date(now.getTime() + 90 * 1000);

  const updatedRound = await prisma.round.update({
    where: { id: roundId },
    data: {
      startedAt: now,
      endedAt: endedAt,
    },
  });

  return {
    id: updatedRound.id,
    roundNumber: updatedRound.roundNumber,
    roomId: updatedRound.roomId,
    location: await prisma.curatedLocation.findUnique({
      where: { id: updatedRound.locationId },
      select: { id: true, lat: true, lng: true, description: true },
    }),
    startedAt: updatedRound.startedAt,
    endedAt: updatedRound.endedAt,
  };
};