import prisma from "../config/prisma.config.js";
import * as roundService from "../services/round.service.js";
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
    const { roundId } = req.body;
    const userId = req.user.id;

    // ดึงรอบเพื่อหา roomId และตรวจสอบสิทธิ์
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: { room: true }, // รวมข้อมูล room มาด้วย
    });

    if (!round) return next(createError(404, "Round not found"));
    if (round.room.hostId !== userId) {
      return next(createError(403, "Only host can start this round"));
    }

    if (round.startedAt !== null) {
      return next(createError(400, "This round has already started"));
    }

    const updatedRound = await roundService.startNextRound(roundId);
    if (!updatedRound)
      return next(createError(400, "Could not start the round"));

    res.json({ round: updatedRound });
  } catch (error) {
    next(error);
  }
};
