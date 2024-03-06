/*
  Warnings:

  - You are about to drop the column `telp_number` on the `user` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `User_telp_number_key` ON `user`;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `telp_number`;
