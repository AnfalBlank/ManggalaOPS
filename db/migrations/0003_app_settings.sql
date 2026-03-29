CREATE TABLE IF NOT EXISTS `app_settings` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `company_name` text NOT NULL DEFAULT 'PT. Manggala Utama Indonesia',
  `company_email` text DEFAULT 'admin@manggala-utama.id',
  `company_phone` text DEFAULT '+62 878-8424-1703',
  `company_address` text DEFAULT 'Jakarta',
  `default_tax_percent` real DEFAULT 11,
  `quotation_validity_days` integer DEFAULT 7,
  `invoice_due_days` integer DEFAULT 14,
  `default_payment_method` text DEFAULT 'CBD',
  `finance_approval_required` integer DEFAULT true,
  `allow_user_self_reset` integer DEFAULT false,
  `updated_at` integer
);
--> statement-breakpoint
INSERT INTO `app_settings` (`company_name`, `company_email`, `company_phone`, `company_address`, `default_tax_percent`, `quotation_validity_days`, `invoice_due_days`, `default_payment_method`, `finance_approval_required`, `allow_user_self_reset`, `updated_at`)
SELECT 'PT. Manggala Utama Indonesia', 'admin@manggala-utama.id', '+62 878-8424-1703', 'Jakarta', 11, 7, 14, 'CBD', true, false, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM `app_settings` LIMIT 1);