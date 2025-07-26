import * as roomService from "../services/room.service.js";
import createError from "../utils/create-error.util.js";

export const createRoom = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // console.log('req.user', userId)
    const { mode, maxPlayers, difficulty } = req.body;
    // console.log('req.body', req.body)
    if (!["single", "multi"].includes(mode)) {
      return next(createError(400, "Invalid mode"));
    }
    if (!["classic", "challenge"].includes(difficulty)) {
      return next(createError(400, "Invalid difficulty"));
    }
    if (typeof maxPlayers !== "number" || maxPlayers < 1) {
      return next(createError(400, "Invalid maxPlayers"));
    }

    const room = await roomService.createRoom(
      userId,
      mode,
      maxPlayers,
      difficulty
    );

    res.json({ message: "room create", room });
  } catch (error) {
    next(error);
  }
};
