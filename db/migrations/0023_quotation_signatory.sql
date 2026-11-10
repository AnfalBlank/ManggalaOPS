ALTER TABLE `app_settings` ADD COLUMN `quotation_signatory_name` text DEFAULT 'Adiatma Pasau';
--> statement-breakpoint
ALTER TABLE `app_settings` ADD COLUMN `quotation_signatory_title` text DEFAULT 'Manager Marketing';
--> statement-breakpoint
ALTER TABLE `app_settings` ADD COLUMN `quotation_signature_image_url` text;
--> statement-breakpoint
UPDATE `app_settings` SET `quotation_signatory_name` = 'Adiatma Pasau', `quotation_signatory_title` = 'Manager Marketing', `quotation_signature_image_url` = `signature_image_url`, `signature_image_url` = NULL;
