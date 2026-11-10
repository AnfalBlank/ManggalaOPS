-- Client PO / contract per quotation (one PO per quotation), supplier POs per client PO,
-- and links from invoices and delivery orders back to the client PO. Additive only.
CREATE TABLE IF NOT EXISTS `client_pos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quotation_id` integer NOT NULL,
	`client_id` integer NOT NULL,
	`project_id` integer,
	`po_number` text NOT NULL,
	`po_date` integer NOT NULL,
	`value` real,
	`file_url` text,
	`notes` text,
	`closed_at` integer,
	`created_by` integer,
	`created_at` integer,
	FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`id`),
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`),
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `client_pos_quotation_unique` ON `client_pos` (`quotation_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `client_po_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_po_id` integer NOT NULL,
	`description` text NOT NULL,
	`qty` integer NOT NULL,
	`unit` text DEFAULT 'Unit',
	`unit_price` real NOT NULL,
	`unit_cost` real DEFAULT 0,
	`amount` real NOT NULL,
	FOREIGN KEY (`client_po_id`) REFERENCES `client_pos`(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `supplier_pos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_po_id` integer NOT NULL,
	`supplier_name` text NOT NULL,
	`supplier_contact` text,
	`supplier_phone` text,
	`supplier_address` text,
	`date` integer NOT NULL,
	`expected_date` integer,
	`payment_terms` text,
	`notes` text,
	`subtotal` real DEFAULT 0,
	`tax` real DEFAULT 0,
	`total` real DEFAULT 0,
	`status` text DEFAULT 'Draft',
	`created_by` integer,
	`created_at` integer,
	FOREIGN KEY (`client_po_id`) REFERENCES `client_pos`(`id`),
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `supplier_po_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`supplier_po_id` integer NOT NULL,
	`description` text NOT NULL,
	`qty` integer NOT NULL,
	`unit` text DEFAULT 'Unit',
	`unit_price` real NOT NULL,
	`amount` real NOT NULL,
	FOREIGN KEY (`supplier_po_id`) REFERENCES `supplier_pos`(`id`)
);
--> statement-breakpoint
ALTER TABLE `invoices` ADD `client_po_id` integer REFERENCES `client_pos`(`id`);
--> statement-breakpoint
ALTER TABLE `delivery_orders` ADD `client_po_id` integer REFERENCES `client_pos`(`id`);
--> statement-breakpoint
ALTER TABLE `delivery_order_items` ADD `client_po_item_id` integer REFERENCES `client_po_items`(`id`);
