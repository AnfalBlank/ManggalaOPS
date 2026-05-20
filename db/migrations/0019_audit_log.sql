CREATE TABLE IF NOT EXISTS `audit_log` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` integer,
  `action` text NOT NULL,
  `entity` text,
  `entity_id` text,
  `payload` text,
  `ip` text,
  `created_at` integer,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `audit_log_created_at_idx` ON `audit_log` (`created_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `audit_log_entity_idx` ON `audit_log` (`entity`, `entity_id`);
