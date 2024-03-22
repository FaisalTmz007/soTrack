-- AlterTable
ALTER TABLE `post` MODIFY `author` VARCHAR(191) NULL,
    MODIFY `caption` VARCHAR(191) NULL,
    MODIFY `published_at` DATETIME(3) NULL,
    MODIFY `crime_type` VARCHAR(191) NULL,
    MODIFY `likes` INTEGER NULL,
    MODIFY `comments` INTEGER NULL,
    MODIFY `post_url` TEXT NULL,
    MODIFY `media_url` TEXT NULL;
