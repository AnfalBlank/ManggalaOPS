CREATE TABLE `estimations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`buy_price` real NOT NULL,
	`sell_price` real NOT NULL,
	`qty` integer NOT NULL,
	`buy_include_ppn` integer NOT NULL,
	`sell_include_ppn` integer NOT NULL,
	`ppn_rate` real NOT NULL,
	`created_at` integer
);
