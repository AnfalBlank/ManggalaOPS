CREATE TABLE IF NOT EXISTS `_schema_migrations` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `filename` text NOT NULL UNIQUE,
  `applied_at` integer NOT NULL
);
