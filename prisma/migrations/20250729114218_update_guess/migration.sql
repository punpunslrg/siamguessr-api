/*
  Warnings:

  - A unique constraint covering the columns `[roundId,userId]` on the table `Guess` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Guess_roundId_userId_key` ON `Guess`(`roundId`, `userId`);
