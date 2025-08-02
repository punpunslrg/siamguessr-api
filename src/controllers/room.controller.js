import prisma from "../config/prisma.config.js";
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

    if (room.mode === "single") {
      // Auto start the game immediately for single-player mode
      const startedAt = new Date();
      const endedAt = new Date(Date.now() + 90 * 1000);

      await prisma.room.update({
        where: { id: room.id },
        data: { status: "playing" },
      });

      await prisma.round.updateMany({
        where: { roomId: room.id, roundNumber: 1 },
        data: { startedAt, endedAt },
      });
    }

    // For both modes, return the room info
    const updatedRoom = await prisma.room.findUnique({
      where: { id: room.id },
      include: {
        players: { include: { user: true } },
        rounds: {
          include: {
            location: {
              select: {
                id: true,
                lat: true,
                lng: true,
                description: true,
              },
            },
          },
        },
      },
    });

    return res.json({ message: "room created", room: updatedRoom });
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
    console.log("roomId", roomId);
    const room = await roomService.getRoom(roomId);
    if (!room) return createError(404, "Room not found");
    res.json({ room });
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

export const updatePlayerStatus = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    const { status } = req.body;

    const valid = ["ready", "waiting"].includes(status);
    if (!valid) return next(createError(400, "Invalid status"));

    const updated = await roomService.setPlayerStatus(roomId, userId, status);

    // (optional) emit socket event "room:update" ให้ทุกคนใน lobby sync รายชื่อ
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const getCurrentRound = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id; // ได้จาก token (middleware authCheck)

    // เช็คว่า user อยู่ในห้องจริงหรือเปล่า (ถ้าต้องการ)
    const isMember = await roomService.checkRoomMember(roomId, userId);
    if (!isMember) return createError(403, "You are not a member of this room");

    const currentRound = await roomService.getCurrentRound(roomId);
    if (!currentRound) return createError(404, "No current round");
    res.json(currentRound);
  } catch (error) {
    next(error);
  }
};

export const getRoomResults = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    console.log(roomId);
    const results = await roomService.getRoomResults(roomId);
    if (!results)
      return next(createError(404, "Room not found or not finished"));

    res.json(results);
  } catch (error) {
    next(error);
  }
};
