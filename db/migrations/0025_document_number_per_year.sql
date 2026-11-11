-- Nomor dokumen urut per tahun (izin owner 11/11). Cuma nambah: kolom nomor (boleh kosong, unik) di 5 tabel dokumen,
-- tabel penghitung per jenis & tahun, dan isi nomor dokumen lama PERSIS rumus lama (ID + bulan/tahun tanggal dokumen WIB).
-- Kode lama gak baca kolom ini. Penghitung 2026 mulai setelah nomor terbesar yang pernah kepakai (sqlite_sequence).
ALTER TABLE `quotations` ADD `nomor` text
--> statement-breakpoint
ALTER TABLE `invoices` ADD `nomor` text
--> statement-breakpoint
ALTER TABLE `delivery_orders` ADD `nomor` text
--> statement-breakpoint
ALTER TABLE `supplier_pos` ADD `nomor` text
--> statement-breakpoint
ALTER TABLE `payments` ADD `nomor` text
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `quotations_nomor_unique` ON `quotations` (`nomor`)
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `invoices_nomor_unique` ON `invoices` (`nomor`)
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `delivery_orders_nomor_unique` ON `delivery_orders` (`nomor`)
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `supplier_pos_nomor_unique` ON `supplier_pos` (`nomor`)
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `payments_nomor_unique` ON `payments` (`nomor`)
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `nomor_dokumen` (
	`jenis` text NOT NULL,
	`tahun` integer NOT NULL,
	`terakhir` integer NOT NULL,
	PRIMARY KEY(`jenis`, `tahun`)
)
--> statement-breakpoint
UPDATE `quotations` SET `nomor` = printf('%04d', id) || '/MUI/SP/' || CASE CAST(strftime('%m', date, 'unixepoch', '+7 hours') AS INTEGER) WHEN 1 THEN 'I' WHEN 2 THEN 'II' WHEN 3 THEN 'III' WHEN 4 THEN 'IV' WHEN 5 THEN 'V' WHEN 6 THEN 'VI' WHEN 7 THEN 'VII' WHEN 8 THEN 'VIII' WHEN 9 THEN 'IX' WHEN 10 THEN 'X' WHEN 11 THEN 'XI' WHEN 12 THEN 'XII' END || '/' || strftime('%Y', date, 'unixepoch', '+7 hours') WHERE `nomor` IS NULL
--> statement-breakpoint
UPDATE `invoices` SET `nomor` = printf('%04d', id) || '/MUI/INV/' || CASE CAST(strftime('%m', date, 'unixepoch', '+7 hours') AS INTEGER) WHEN 1 THEN 'I' WHEN 2 THEN 'II' WHEN 3 THEN 'III' WHEN 4 THEN 'IV' WHEN 5 THEN 'V' WHEN 6 THEN 'VI' WHEN 7 THEN 'VII' WHEN 8 THEN 'VIII' WHEN 9 THEN 'IX' WHEN 10 THEN 'X' WHEN 11 THEN 'XI' WHEN 12 THEN 'XII' END || '/' || strftime('%Y', date, 'unixepoch', '+7 hours') WHERE `nomor` IS NULL
--> statement-breakpoint
UPDATE `delivery_orders` SET `nomor` = printf('%04d', id) || '/MUI/SJ/' || CASE CAST(strftime('%m', date, 'unixepoch', '+7 hours') AS INTEGER) WHEN 1 THEN 'I' WHEN 2 THEN 'II' WHEN 3 THEN 'III' WHEN 4 THEN 'IV' WHEN 5 THEN 'V' WHEN 6 THEN 'VI' WHEN 7 THEN 'VII' WHEN 8 THEN 'VIII' WHEN 9 THEN 'IX' WHEN 10 THEN 'X' WHEN 11 THEN 'XI' WHEN 12 THEN 'XII' END || '/' || strftime('%Y', date, 'unixepoch', '+7 hours') WHERE `nomor` IS NULL
--> statement-breakpoint
UPDATE `supplier_pos` SET `nomor` = printf('%04d', id) || '/MUI/PO/' || CASE CAST(strftime('%m', date, 'unixepoch', '+7 hours') AS INTEGER) WHEN 1 THEN 'I' WHEN 2 THEN 'II' WHEN 3 THEN 'III' WHEN 4 THEN 'IV' WHEN 5 THEN 'V' WHEN 6 THEN 'VI' WHEN 7 THEN 'VII' WHEN 8 THEN 'VIII' WHEN 9 THEN 'IX' WHEN 10 THEN 'X' WHEN 11 THEN 'XI' WHEN 12 THEN 'XII' END || '/' || strftime('%Y', date, 'unixepoch', '+7 hours') WHERE `nomor` IS NULL
--> statement-breakpoint
UPDATE `payments` SET `nomor` = 'KWT-PAY-' || printf('%04d', id) WHERE `nomor` IS NULL
--> statement-breakpoint
INSERT INTO `nomor_dokumen` (`jenis`, `tahun`, `terakhir`) VALUES ('SP', 2026, (SELECT max(coalesce((SELECT seq FROM sqlite_sequence WHERE name = 'quotations'), 0), coalesce((SELECT max(id) FROM `quotations`), 0)))) ON CONFLICT(`jenis`, `tahun`) DO UPDATE SET `terakhir` = max(`terakhir`, excluded.`terakhir`)
--> statement-breakpoint
INSERT INTO `nomor_dokumen` (`jenis`, `tahun`, `terakhir`) VALUES ('INV', 2026, (SELECT max(coalesce((SELECT seq FROM sqlite_sequence WHERE name = 'invoices'), 0), coalesce((SELECT max(id) FROM `invoices`), 0)))) ON CONFLICT(`jenis`, `tahun`) DO UPDATE SET `terakhir` = max(`terakhir`, excluded.`terakhir`)
--> statement-breakpoint
INSERT INTO `nomor_dokumen` (`jenis`, `tahun`, `terakhir`) VALUES ('SJ', 2026, (SELECT max(coalesce((SELECT seq FROM sqlite_sequence WHERE name = 'delivery_orders'), 0), coalesce((SELECT max(id) FROM `delivery_orders`), 0)))) ON CONFLICT(`jenis`, `tahun`) DO UPDATE SET `terakhir` = max(`terakhir`, excluded.`terakhir`)
--> statement-breakpoint
INSERT INTO `nomor_dokumen` (`jenis`, `tahun`, `terakhir`) VALUES ('PO', 2026, (SELECT max(coalesce((SELECT seq FROM sqlite_sequence WHERE name = 'supplier_pos'), 0), coalesce((SELECT max(id) FROM `supplier_pos`), 0)))) ON CONFLICT(`jenis`, `tahun`) DO UPDATE SET `terakhir` = max(`terakhir`, excluded.`terakhir`)
--> statement-breakpoint
INSERT INTO `nomor_dokumen` (`jenis`, `tahun`, `terakhir`) VALUES ('KW', 2026, (SELECT max(coalesce((SELECT seq FROM sqlite_sequence WHERE name = 'payments'), 0), coalesce((SELECT max(id) FROM `payments`), 0)))) ON CONFLICT(`jenis`, `tahun`) DO UPDATE SET `terakhir` = max(`terakhir`, excluded.`terakhir`)
