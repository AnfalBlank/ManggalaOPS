CREATE TABLE IF NOT EXISTS `delivery_orders` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `client_id` integer NOT NULL,
  `project_id` integer,
  `invoice_id` integer,
  `quotation_id` integer,
  `date` integer NOT NULL,
  `vehicle_number` text,
  `driver_name` text,
  `shipping_method` text,
  `recipient_name` text,
  `recipient_company` text,
  `recipient_address` text,
  `recipient_phone` text,
  `subject` text,
  `introduction` text,
  `notes` text,
  `closing_note` text,
  `signatory_name` text,
  `signatory_title` text,
  `status` text DEFAULT 'Draft',
  `created_at` integer,
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`),
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`),
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`),
  FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `delivery_order_items` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `delivery_order_id` integer NOT NULL,
  `description` text NOT NULL,
  `qty` integer NOT NULL,
  `unit` text DEFAULT 'Unit',
  `serial_number` text,
  `notes` text,
  FOREIGN KEY (`delivery_order_id`) REFERENCES `delivery_orders`(`id`)
);
