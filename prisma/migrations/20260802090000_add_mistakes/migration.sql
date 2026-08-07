CREATE TABLE `mistakes` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `sceneId` VARCHAR(191) NOT NULL,
    `original` TEXT NOT NULL,
    `improved` TEXT NOT NULL,
    `reasonZh` TEXT NOT NULL,
    `reasonEn` TEXT NOT NULL,
    `category` ENUM('GRAMMAR', 'VOCABULARY', 'EXPRESSION') NOT NULL DEFAULT 'EXPRESSION',
    `reviewCount` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('LEARNING', 'MASTERED') NOT NULL DEFAULT 'LEARNING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `mistakes_conversationId_key` ON `mistakes`(`conversationId`);
CREATE INDEX `mistakes_userId_status_createdAt_idx` ON `mistakes`(`userId`, `status`, `createdAt`);
CREATE INDEX `mistakes_sceneId_idx` ON `mistakes`(`sceneId`);

ALTER TABLE `mistakes` ADD CONSTRAINT `mistakes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `mistakes` ADD CONSTRAINT `mistakes_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `mistakes` ADD CONSTRAINT `mistakes_sceneId_fkey` FOREIGN KEY (`sceneId`) REFERENCES `scenes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
