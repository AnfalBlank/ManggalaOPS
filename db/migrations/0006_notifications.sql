CREATE TABLE IF NOT EXISTS `notifications` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `title` text NOT NULL,
  `message` text,
  `type` text DEFAULT 'info',
  `target_role` text,
  `is_read` integer DEFAULT false,
  `created_at` integer
);