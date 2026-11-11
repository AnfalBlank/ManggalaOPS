-- Belanja per PO: pengeluaran bisa disambung ke PO klien & PO supplier, plus file nota. Cuma nambah kolom (boleh kosong),
-- data lama gak diubah.
ALTER TABLE `expenses` ADD `client_po_id` integer REFERENCES `client_pos`(`id`);
--> statement-breakpoint
ALTER TABLE `expenses` ADD `supplier_po_id` integer REFERENCES `supplier_pos`(`id`);
--> statement-breakpoint
ALTER TABLE `expenses` ADD `receipt_url` text;
