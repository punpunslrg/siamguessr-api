 import createError from "../utils/create-error.util.js";
import * as roomService from "../services/room.service.js";

export const createRoom = async (req, res, next) => {
  try {
    const { hostId, mode, maxPlayers } = req.body;
    const room = await roomService.createRoom(hostId, mode, maxPlayers);
    console.log("room ctrl", room);
    res.json({ message: "room create" }, room);
  } catch (error) {
    next(error);
  }
};
