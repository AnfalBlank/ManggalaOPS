CREATE TABLE IF NOT EXISTS `chat_threads` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `title` text NOT NULL,
  `kind` text DEFAULT 'direct',
  `project_id` integer,
  `created_by_user_id` integer,
  `created_at` integer,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `chat_participants` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `thread_id` integer NOT NULL,
  `user_id` integer NOT NULL,
  FOREIGN KEY (`thread_id`) REFERENCES `chat_threads`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `thread_id` integer NOT NULL,
  `sender_user_id` integer NOT NULL,
  `body` text NOT NULL,
  `created_at` integer,
  FOREIGN KEY (`thread_id`) REFERENCES `chat_threads`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`sender_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);