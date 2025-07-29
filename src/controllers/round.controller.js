import * as roundService from "../services/round.service.js"
import createError from "../utils/create-error.util.js";

export const getRoundResult = async (req, res, next) => {
  try {
    const { roundId } = req.params;
    const result = await roundService.getRoundResult(roundId);
    if (!result) return next(createError(404, "Round not found"));
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const startNextRound = async (req, res, next) => {
  try {
    const { roomId } = req.body;
    const userId = req.user.id;

    // (option) เช็คว่า user เป็น host
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) return next(createError(404, "Room not found"));
    if (room.hostId !== userId) return next(createError(403, "Only host can start new round"));

    const nextRound = await roundService.startNextRound(roomId);
    if (!nextRound) return next(createError(400, "No next round available"));
    res.json(nextRound);
  } catch (error) {
    next(error);
  }
};
