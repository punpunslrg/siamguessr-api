import prisma from "../config/prisma.config.js";

export const createRoom = async ( userId, mode, maxPlayers, difficulty ) => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const room = await prisma.room.create({
    data: {
      code,
      hostId: userId,
      mode,
      maxPlayers,
      difficulty,
    },
    include: { players: { include: { user: true } } }
  });
  await prisma.roomPlayer.create({
    data:{
      roomId: room.id,
      userId: userId,
      isHost: true,
      status:"ready"
    }
  })
  return room;
};
