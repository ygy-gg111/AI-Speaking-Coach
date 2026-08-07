CREATE TABLE `pronunciation_attempts` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `sceneId` VARCHAR(191) NOT NULL,
  `target` TEXT NOT NULL,
  `transcript` TEXT NOT NULL,
  `score` INTEGER NOT NULL,
  `accuracy` INTEGER NOT NULL,
  `completeness` INTEGER NOT NULL,
  `fluency` INTEGER NOT NULL,
  `prosody` INTEGER NOT NULL,
  `durationMs` INTEGER NOT NULL,
  `pauseRatio` DOUBLE NOT NULL,
  `energyVariation` DOUBLE NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `pronunciation_attempts_userId_createdAt_idx`(`userId`, `createdAt`),
  INDEX `pronunciation_attempts_sceneId_createdAt_idx`(`sceneId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `pronunciation_attempts`
  ADD CONSTRAINT `pronunciation_attempts_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `pronunciation_attempts`
  ADD CONSTRAINT `pronunciation_attempts_sceneId_fkey`
  FOREIGN KEY (`sceneId`) REFERENCES `scenes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
