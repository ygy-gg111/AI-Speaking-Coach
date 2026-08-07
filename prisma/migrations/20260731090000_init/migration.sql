CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `locale` VARCHAR(191) NOT NULL DEFAULT 'zh-CN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `user_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NULL,
    `nativeLanguage` VARCHAR(191) NOT NULL DEFAULT 'zh-CN',
    `targetLanguage` VARCHAR(191) NOT NULL DEFAULT 'en',
    `level` VARCHAR(191) NOT NULL DEFAULT 'A2',
    `dailyGoalMinutes` INTEGER NOT NULL DEFAULT 10,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `scenes` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `titleKey` VARCHAR(191) NOT NULL,
    `descriptionKey` VARCHAR(191) NOT NULL,
    `searchText` TEXT NOT NULL,
    `systemPrompt` TEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `coverTone` VARCHAR(191) NOT NULL,
    `coverMark` VARCHAR(191) NOT NULL,
    `difficulty` INTEGER NOT NULL,
    `estimatedMinutes` INTEGER NOT NULL,
    `lessonCount` INTEGER NOT NULL,
    `content` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `conversations` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `sceneId` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'COMPLETED', 'ABANDONED') NOT NULL DEFAULT 'ACTIVE',
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endedAt` DATETIME(3) NULL,
    `durationSeconds` INTEGER NULL,
    `summary` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `messages` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `clientEventId` VARCHAR(191) NULL,
    `role` ENUM('USER', 'ASSISTANT', 'SYSTEM') NOT NULL,
    `content` TEXT NOT NULL,
    `transcript` TEXT NULL,
    `sequence` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `realtime_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `providerSessionId` VARCHAR(191) NULL,
    `status` ENUM('CREATED', 'CONNECTED', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'CREATED',
    `configuration` JSON NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endedAt` DATETIME(3) NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `analysis_jobs` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `result` JSON NULL,
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `users_email_key` ON `users`(`email`);
CREATE UNIQUE INDEX `user_profiles_userId_key` ON `user_profiles`(`userId`);
CREATE UNIQUE INDEX `scenes_slug_key` ON `scenes`(`slug`);
CREATE INDEX `scenes_category_isActive_sortOrder_idx` ON `scenes`(`category`, `isActive`, `sortOrder`);
CREATE INDEX `conversations_userId_createdAt_idx` ON `conversations`(`userId`, `createdAt`);
CREATE INDEX `conversations_sceneId_idx` ON `conversations`(`sceneId`);
CREATE INDEX `messages_conversationId_createdAt_idx` ON `messages`(`conversationId`, `createdAt`);
CREATE UNIQUE INDEX `messages_conversationId_sequence_key` ON `messages`(`conversationId`, `sequence`);
CREATE UNIQUE INDEX `messages_conversationId_clientEventId_key` ON `messages`(`conversationId`, `clientEventId`);
CREATE INDEX `realtime_sessions_conversationId_idx` ON `realtime_sessions`(`conversationId`);
CREATE INDEX `analysis_jobs_conversationId_status_idx` ON `analysis_jobs`(`conversationId`, `status`);

ALTER TABLE `user_profiles` ADD CONSTRAINT `user_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_sceneId_fkey` FOREIGN KEY (`sceneId`) REFERENCES `scenes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `realtime_sessions` ADD CONSTRAINT `realtime_sessions_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `analysis_jobs` ADD CONSTRAINT `analysis_jobs_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
