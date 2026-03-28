CREATE TABLE `accounts` (
	`code` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`normal_balance` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`contact_person` text,
	`phone` text,
	`email` text,
	`address` text
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` integer NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	`status` text DEFAULT 'Pending',
	`project_id` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoice_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_id` integer NOT NULL,
	`description` text NOT NULL,
	`qty` integer NOT NULL,
	`unit_price` real NOT NULL,
	`amount` real NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` integer NOT NULL,
	`project_id` integer,
	`quotation_id` integer,
	`date` integer NOT NULL,
	`due_date` integer,
	`subtotal` real,
	`tax_ppn` real,
	`total` real,
	`status` text DEFAULT 'Unpaid',
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`journal_id` integer NOT NULL,
	`account_code` text NOT NULL,
	`debit` real DEFAULT 0,
	`credit` real DEFAULT 0,
	FOREIGN KEY (`journal_id`) REFERENCES `journals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account_code`) REFERENCES `accounts`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `journals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` integer NOT NULL,
	`description` text NOT NULL,
	`reference_id` text
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` integer NOT NULL,
	`service_name` text NOT NULL,
	`estimated_value` real,
	`status` text DEFAULT 'New',
	`created_at` integer,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_id` integer NOT NULL,
	`client_id` integer NOT NULL,
	`amount` real NOT NULL,
	`payment_method` text,
	`date` integer NOT NULL,
	`reference_code` text,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lead_id` integer,
	`client_id` integer NOT NULL,
	`name` text NOT NULL,
	`value` real,
	`status` text DEFAULT 'In Progress',
	`progress` integer DEFAULT 0,
	`start_date` integer,
	`deadline` integer,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `quotation_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quotation_id` integer NOT NULL,
	`description` text NOT NULL,
	`qty` integer NOT NULL,
	`unit_price` real NOT NULL,
	`amount` real NOT NULL,
	FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `quotations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` integer NOT NULL,
	`project_id` integer,
	`date` integer NOT NULL,
	`valid_until` integer,
	`subtotal` real,
	`tax_ppn` real,
	`total` real,
	`status` text DEFAULT 'Draft',
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
