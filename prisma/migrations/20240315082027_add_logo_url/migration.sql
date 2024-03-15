/*
  Warnings:

  - Added the required column `logo_url` to the `Platform` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `platform` ADD COLUMN `logo_url` VARCHAR(191) NOT NULL;
