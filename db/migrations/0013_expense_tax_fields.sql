ALTER TABLE `expenses` ADD COLUMN `tax_mode` text DEFAULT 'none';
ALTER TABLE `expenses` ADD COLUMN `tax_percent` real DEFAULT 0;
ALTER TABLE `expenses` ADD COLUMN `tax_amount` real DEFAULT 0;
ALTER TABLE `expenses` ADD COLUMN `base_amount` real DEFAULT 0;
