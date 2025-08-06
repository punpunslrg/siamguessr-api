/*
  Warnings:

  - The primary key for the `subscription` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `expiresAt` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionPlan` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `subscription` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripeCustomerId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `currentPeriodEnd` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currentPeriodStart` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stripeCustomerId` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tierId` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `subscription` DROP PRIMARY KEY,
    DROP COLUMN `expiresAt`,
    DROP COLUMN `startedAt`,
    DROP COLUMN `subscriptionPlan`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `canceledAt` DATETIME(3) NULL,
    ADD COLUMN `currentPeriodEnd` DATETIME(3) NOT NULL,
    ADD COLUMN `currentPeriodStart` DATETIME(3) NOT NULL,
    ADD COLUMN `endedAt` DATETIME(3) NULL,
    ADD COLUMN `stripeCustomerId` VARCHAR(191) NOT NULL,
    ADD COLUMN `tierId` VARCHAR(191) NOT NULL,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `user` MODIFY `status` ENUM('pending', 'active', 'banned') NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE `SubscriptionTier` (
    `id` VARCHAR(191) NOT NULL,
    `name` ENUM('free', 'basic', 'pro', 'elite') NOT NULL,
    `description` VARCHAR(191) NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `stripePriceId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `SubscriptionTier_name_key`(`name`),
    UNIQUE INDEX `SubscriptionTier_stripePriceId_key`(`stripePriceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Subscription_stripeCustomerId_key` ON `Subscription`(`stripeCustomerId`);

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_tierId_fkey` FOREIGN KEY (`tierId`) REFERENCES `SubscriptionTier`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
