import prisma from "../config/prisma.config.js";

export const submitGuess = async ({
  roundId,
  userId,
  guess,
  distance,
  score,
}) => {
  // 1. Check if the user already guessed in this round
  const exist = await prisma.guess.findUnique({
    where: { roundId_userId: { roundId, userId } },
  });
  if (exist) throw new Error("ALREADY_GUESSED");

  // 2. Create the guess
  const newGuess = await prisma.guess.create({
    data: {
      roundId,
      userId,
      guessedLat: guess.lat !== null ? +guess.lat : null,
      guessedLng: guess.lng !== null ? +guess.lng : null,
      distance,
      score,
      guessedAt: new Date(),
    },
  });

  // 3. Check if this is the last round
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    select: { roundNumber: true, roomId: true },
  });

  if (round?.roundNumber === 5) {
    await prisma.room.update({
      where: { id: round.roomId },
      data: { status: "finished" },
    });
  }

  return newGuess;
};

export const haveAllPlayersGuessed = async (roundId) => {
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: {
      room: {
        include: {
          players: true,
        },
      },
      guesses: true,
    },
  });

  return round.guesses.length === round.room.players.length;
};

export const getRoundResults = async (roundId) => {
  const guesses = await prisma.guess.findMany({
    where: { roundId },
    include: {
      user: true,
    },
  });

  return guesses.map((g) => ({
    playerName: g.user.username,
    guess: g.guess,
    distance: g.distance,
    score: g.score,
  }));
};

export const getRoomIdByRoundId = async (roundId) => {
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: { room: true },
  });

  return round.roomId;
};
