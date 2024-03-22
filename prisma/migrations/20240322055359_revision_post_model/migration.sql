/*
  Warnings:

  - You are about to drop the column `category_id` on the `post` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `post` DROP FOREIGN KEY `Post_category_id_fkey`;

-- AlterTable
ALTER TABLE `post` DROP COLUMN `category_id`;
