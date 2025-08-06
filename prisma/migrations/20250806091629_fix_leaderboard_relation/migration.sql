-- DropForeignKey
ALTER TABLE `Leaderboard` DROP FOREIGN KEY `Leaderboard_userId_fkey`;

-- DropIndex
DROP INDEX `Leaderboard_userId_key` ON `Leaderboard`;

-- AddForeignKey
ALTER TABLE `Leaderboard` ADD CONSTRAINT `Leaderboard_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
