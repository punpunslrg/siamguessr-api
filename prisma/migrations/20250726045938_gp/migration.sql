/*
  Warnings:

  - You are about to drop the column `score` on the `roomplayer` table. All the data in the column will be lost.
  - You are about to drop the column `plan` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `user` table. All the data in the column will be lost.
  - You are about to alter the column `provider` on the `user` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(2))`.
  - You are about to drop the `bestgamescore` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `difficulty` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `bestgamescore` DROP FOREIGN KEY `BestGameScore_roomId_fkey`;

-- DropForeignKey
ALTER TABLE `bestgamescore` DROP FOREIGN KEY `BestGameScore_userId_fkey`;

-- AlterTable
ALTER TABLE `leaderboard` ADD COLUMN `totalGames` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `room` ADD COLUMN `difficulty` ENUM('classic', 'challenge') NOT NULL,
    MODIFY `code` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `roomplayer` DROP COLUMN `score`,
    ADD COLUMN `totalScore` INTEGER NOT NULL DEFAULT 0,
    MODIFY `status` ENUM('ready', 'waiting', 'playing', 'left') NOT NULL DEFAULT 'playing';

-- AlterTable
ALTER TABLE `subscription` DROP COLUMN `plan`,
    ADD COLUMN `subscriptionPlan` ENUM('free', 'basic', 'pro', 'elite') NOT NULL DEFAULT 'free';

-- AlterTable
ALTER TABLE `user` DROP COLUMN `name`,
    ADD COLUMN `username` VARCHAR(191) NULL,
    MODIFY `provider` ENUM('local', 'google', 'facebook') NOT NULL DEFAULT 'local';

-- DropTable
DROP TABLE `bestgamescore`;

-- CreateTable
CREATE TABLE `WinRate` (
    `id` VARCHAR(191) NOT NULL,
    `wins` INTEGER NOT NULL DEFAULT 0,
    `losses` INTEGER NOT NULL DEFAULT 0,
    `draws` INTEGER NOT NULL DEFAULT 0,
    `gamesPlayed` INTEGER NOT NULL DEFAULT 0,
    `winPercentage` DOUBLE NOT NULL DEFAULT 0.0,
    `lastUpdated` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `WinRate_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GameScoreHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `score` INTEGER NOT NULL,
    `playedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `roomId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WinRate` ADD CONSTRAINT `WinRate_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GameScoreHistory` ADD CONSTRAINT `GameScoreHistory_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GameScoreHistory` ADD CONSTRAINT `GameScoreHistory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
