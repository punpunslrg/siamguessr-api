import prisma from "../config/prisma.config.js";

export const createRoom = async ( hostId, mode, maxPlayers ) => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const room = await prisma.room.create({
    data: {
      code,
      hostId,
      mode,
      maxPlayers,
    },
  });
  return room;
};
