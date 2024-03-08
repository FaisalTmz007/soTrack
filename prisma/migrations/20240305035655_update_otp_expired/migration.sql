/*
  Warnings:

  - You are about to drop the column `otp_enabled` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `otp_enabled`,
    ADD COLUMN `otp_expired` DATETIME(3) NULL;
