/*
  Warnings:

  - A unique constraint covering the columns `[userId,roomId]` on the table `RoomPlayer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `RoomPlayer_userId_roomId_key` ON `RoomPlayer`(`userId`, `roomId`);
