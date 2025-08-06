/*
  Warnings:

  - A unique constraint covering the columns `[userId,mode,difficulty]` on the table `Leaderboard` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `difficulty` to the `Leaderboard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mode` to the `Leaderboard` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Leaderboard` ADD COLUMN `difficulty` ENUM('classic', 'challenge') NOT NULL,
    ADD COLUMN `mode` ENUM('single', 'multi') NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Leaderboard_userId_mode_difficulty_key` ON `Leaderboard`(`userId`, `mode`, `difficulty`);
