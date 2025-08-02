import createError from "../utils/create-error.util.js";
import * as guessService from "../services/guess.service.js";

export const submitGuess = async (req, res, next) => {
  try {
    const { roundId, guess, distance, score } = req.body;
    const userId = req.user.id; // จาก token
    console.log("req.body", req.body);
    const result = await guessService.submitGuess({
      roundId,
      userId,
      guess,
      distance,
      score,
    });
    res.status(201).json(result);
  } catch (error) {
    if (error.message === "ALREADY_GUESSED") {
      return next(createError(409, "คุณได้เดาไปแล้วในรอบนี้"));
    }
    next(error);
  }
};
