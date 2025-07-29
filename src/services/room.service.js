import prisma from "../config/prisma.config.js";
import createError from "../utils/create-error.util.js";

async function getRandomLocations(count = 5) {
  // 1. ดึง id ทั้งหมด
  const allIds = await prisma.curatedLocation.findMany({
    where: { isVerified: true },
    select: { id: true },
  });
  // 2. สุ่ม 5 id ที่ไม่ซ้ำ
  const shuffled = allIds.sort(() => 0.5 - Math.random());
  const randomIds = shuffled.slice(0, count).map((loc) => loc.id);
  // 3. query detail ของ 5 id นี้
  const locations = await prisma.curatedLocation.findMany({
    where: { id: { in: randomIds } },
  });
  return locations;
}

export const createRoom = async (userId, mode, maxPlayers, difficulty) => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const room = await prisma.room.create({
    data: {
      code,
      hostId: userId,
      mode,
      maxPlayers,
      difficulty,
    },
    include: { players: { include: { user: true } } },
  });
  const player = await prisma.roomPlayer.create({
    data: {
      roomId: room.id,
      userId,
      isHost: true,
      totalScore: 0,
      status: "playing",
    },
    include: {
      user: { select: { username: true } },
    },
  });
  const locations = await getRandomLocations(5);

  const rounds = [];
  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    const round = await prisma.round.create({
      data: {
        roundNumber: i + 1,
        roomId: room.id,
        locationId: loc.id,
      },
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
    });
    rounds.push(round);
  }
  return {
    id: room.id,
    mode: room.mode,
    code: room.code,
    // url: `http://localhost:8890/api/rooms/${room.code}/join`,
    difficulty: room.difficulty,
    status: room.status,
    maxPlayers: room.maxPlayers,
    hostId: room.hostId,
    createdAt: room.createdAt,
    players: [
      {
        userId: player.userId,
        isHost: player.isHost,
        totalScore: player.totalScore,
        user: player.user, // { username }
      },
    ],
    rounds: rounds.map((r) => ({
      id: r.id,
      roundNumber: r.roundNumber,
      location: r.location,
    })),
  };
};

export const joinRoom = async (roomId, userId) => {
  // 1. Find room & check status
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { players: true },
  });
  if (!room) throw createError(404, "Room not found");
  if (room.status !== "waiting")
    throw createError(400, "Room not available to join");
  if (room.players.length >= room.maxPlayers)
    throw createError(400, "Room is full");
  if (room.players.some((p) => p.userId === userId))
    throw createError(400, "Already joined");

  // 2. Add player
  await prisma.roomPlayer.create({
    data: {
      roomId,
      userId,
      isHost: false,
      status: "waiting",
    },
  });

  // 3. return room info (with player list)
  const updatedRoom = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      players: {
        include: { user: { select: { username: true } } },
      },
      rounds: {
        include: { location: true },
      },
    },
  });
  return updatedRoom;
};

export const getRoom = async (roomId) => {
  return await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      players: {
        include: { user: { select: { username: true } } },
      },
      rounds: {
        include: {
          location: {
            select: { id: true, lat: true, lng: true, description: true },
          },
        },
      },
    },
  });
};

export const leaveRoom = async (roomId, userId) => {
  // 1. หา room
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw createError(404, "Room not found");

  // 2. เช็คว่า user นี้เป็น host หรือไม่
  if (room.hostId === userId) {
    // Host ออก → ลบห้องทั้งหมด (รวม relation ด้วย)
    await prisma.room.delete({
      where: { id: roomId }
    });
    return { message: "Host left — room exploded!" };
  }

  // ถ้าไม่ใช่ host → แค่ลบ player ออกจากห้อง
  await prisma.roomPlayer.delete({
    where: { roomId_userId: { roomId, userId } }
  });
  return { message: "Left room" };
};

export const startRoom = async (roomId, userId) => {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw createError("Room not found");
  if (room.hostId !== userId) throw createError("Only host can start the game");
  if (room.status !== "waiting") throw createError("Room already started or finished");

  const allReady = room.players.every(p => p.status === "ready");
  if (!allReady) throw createError("Not all players are ready");

  // 1. เปลี่ยน status room เป็น playing
  await prisma.room.update({
    where: { id: roomId },
    data: { status: "playing" }
  });

  // 2. (option) emit socket event ให้ทุกคนรู้ว่าเกมเริ่ม
  // io.to(roomId).emit("game:start", {...})

  return { message: "Game started" };
};
