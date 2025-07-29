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

export const joinRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    const room = await roomService.joinRoom(roomId, userId);
    // (option) emit socket event here
    res.json(room);
  } catch (error) {
    next(error);
  }
};

export const getRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    console.log('roomId', roomId)
    const room = await roomService.getRoom(roomId);
    if (!room) return createError(404, "Room not found");
    res.json(room);
  } catch (error) {
    next(error);
  }
};

export const leaveRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    const result = await roomService.leaveRoom(roomId, userId);

    // (option) emit socket event "room:exploded" หรือ "room:update"
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const startRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    const result = await roomService.startRoom(roomId, userId);
    res.json(result);
  } catch (error) {
    if (error.message === "Not all players are ready") {
      return next(createError(400, "ยังมีผู้เล่นที่ไม่ ready"));
    }
    next(error);
  }
};

