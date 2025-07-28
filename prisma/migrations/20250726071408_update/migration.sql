/*
  Warnings:

  - You are about to drop the column `locationLat` on the `round` table. All the data in the column will be lost.
  - You are about to drop the column `locationLng` on the `round` table. All the data in the column will be lost.
  - Added the required column `locationId` to the `Round` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `round` DROP COLUMN `locationLat`,
    DROP COLUMN `locationLng`,
    ADD COLUMN `locationId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `CuratedLocation` (
    `id` VARCHAR(191) NOT NULL,
    `lat` DECIMAL(10, 7) NOT NULL,
    `lng` DECIMAL(10, 7) NOT NULL,
    `countryCode` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT true,
    `lastCheckedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Round` ADD CONSTRAINT `Round_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `CuratedLocation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
