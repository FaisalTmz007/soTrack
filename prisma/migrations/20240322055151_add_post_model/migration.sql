-- CreateTable
CREATE TABLE `Post` (
    `id` VARCHAR(191) NOT NULL,
    `author` VARCHAR(191) NOT NULL,
    `caption` VARCHAR(191) NOT NULL,
    `published_at` DATETIME(3) NOT NULL,
    `crime_type` VARCHAR(191) NOT NULL,
    `likes` INTEGER NOT NULL,
    `comments` INTEGER NOT NULL,
    `post_url` TEXT NOT NULL,
    `media_url` TEXT NOT NULL,
    `platform_id` VARCHAR(191) NOT NULL,
    `category_id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_platform_id_fkey` FOREIGN KEY (`platform_id`) REFERENCES `Platform`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
