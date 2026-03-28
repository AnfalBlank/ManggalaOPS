ALTER TABLE `quotation_items` ADD COLUMN `unit` text DEFAULT 'Unit';
--> statement-breakpoint
ALTER TABLE `invoice_items` ADD COLUMN `unit` text DEFAULT 'Unit';
--> statement-breakpoint
ALTER TABLE `quotations` ADD COLUMN `payment_method` text DEFAULT 'CBD';
--> statement-breakpoint
ALTER TABLE `quotations` ADD COLUMN `attachment` text;
--> statement-breakpoint
ALTER TABLE `quotations` ADD COLUMN `subject` text;
--> statement-breakpoint
ALTER TABLE `quotations` ADD COLUMN `recipient_name` text;
--> statement-breakpoint
ALTER TABLE `quotations` ADD COLUMN `recipient_company` text;
--> statement-breakpoint
ALTER TABLE `quotations` ADD COLUMN `recipient_address` text;
--> statement-breakpoint
ALTER TABLE `quotations` ADD COLUMN `introduction` text;
--> statement-breakpoint
ALTER TABLE `quotations` ADD COLUMN `terms` text;
--> statement-breakpoint
ALTER TABLE `quotations` ADD COLUMN `closing_note` text;
--> statement-breakpoint
ALTER TABLE `quotations` ADD COLUMN `signatory_name` text;
--> statement-breakpoint
ALTER TABLE `quotations` ADD COLUMN `signatory_title` text;
--> statement-breakpoint
ALTER TABLE `invoices` ADD COLUMN `payment_method` text DEFAULT 'CBD';
--> statement-breakpoint
ALTER TABLE `invoices` ADD COLUMN `attachment` text;
--> statement-breakpoint
ALTER TABLE `invoices` ADD COLUMN `subject` text;
--> statement-breakpoint
ALTER TABLE `invoices` ADD COLUMN `recipient_name` text;
--> statement-breakpoint
ALTER TABLE `invoices` ADD COLUMN `recipient_company` text;
--> statement-breakpoint
ALTER TABLE `invoices` ADD COLUMN `recipient_address` text;
--> statement-breakpoint
ALTER TABLE `invoices` ADD COLUMN `introduction` text;
--> statement-breakpoint
ALTER TABLE `invoices` ADD COLUMN `terms` text;
--> statement-breakpoint
ALTER TABLE `invoices` ADD COLUMN `closing_note` text;
--> statement-breakpoint
ALTER TABLE `invoices` ADD COLUMN `signatory_name` text;
--> statement-breakpoint
ALTER TABLE `invoices` ADD COLUMN `signatory_title` text;