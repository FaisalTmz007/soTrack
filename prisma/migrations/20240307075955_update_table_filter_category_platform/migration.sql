-- CreateTable
CREATE TABLE `Platform` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Platform_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Category_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Filter` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `parameter` VARCHAR(191) NOT NULL,
    `is_active` BOOLEAN NOT NULL,
    `user_id` INTEGER NOT NULL,
    `platform_id` INTEGER NOT NULL,
    `category_id` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Filter` ADD CONSTRAINT `Filter_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Filter` ADD CONSTRAINT `Filter_platform_id_fkey` FOREIGN KEY (`platform_id`) REFERENCES `Platform`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Filter` ADD CONSTRAINT `Filter_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
