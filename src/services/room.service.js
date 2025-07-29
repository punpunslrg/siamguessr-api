import prisma from "../config/prisma.config.js";

async function getRandomLocations(count = 5) {
  // 1. ดึง id ทั้งหมด
  const allIds = await prisma.curatedLocation.findMany({
    where: { isVerified: true },
    select: { id: true }
  });
  // 2. สุ่ม 5 id ที่ไม่ซ้ำ
  const shuffled = allIds.sort(() => 0.5 - Math.random());
  const randomIds = shuffled.slice(0, count).map(loc => loc.id);
  // 3. query detail ของ 5 id นี้
  const locations = await prisma.curatedLocation.findMany({
    where: { id: { in: randomIds } }
  });
  return locations;
}

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
    }
  });
  const locations = await getRandomLocations(5)

  const rounds = []
  for(let i=0; i<locations.length; i++){
    const loc = locations[i]
    const round = await prisma.round.create({
      data:{
        roundNumber: i+1,
        roomId: room.id,
        locationId: loc.id
      },
      include:{
        location: {select:{
          id: true,
          lat: true,
          lng: true,
          description: true 
        }}
      }
    })
    rounds.push(round)
  }
  return {
    id: room.id,
    mode: room.mode,
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
      }
    ],
    rounds: rounds.map(r => ({
      id: r.id,
      roundNumber: r.roundNumber,
      location: r.location,
    }))
  };
};


