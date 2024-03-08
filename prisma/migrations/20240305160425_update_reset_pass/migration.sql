/*
  Warnings:

  - You are about to drop the column `reset_password_expired` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `reset_password_expired`;
