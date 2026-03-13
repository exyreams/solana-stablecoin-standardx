CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`address` text NOT NULL,
	`reason` text,
	`signature` text,
	`timestamp` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `burn_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`from_token_account` text NOT NULL,
	`amount` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`signature` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `delivery_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`event` text NOT NULL,
	`status` text NOT NULL,
	`error` text,
	`timestamp` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `event_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`signature` text NOT NULL,
	`name` text NOT NULL,
	`data` text NOT NULL,
	`timestamp` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mint_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`recipient` text NOT NULL,
	`amount` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`signature` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stablecoins` (
	`id` text PRIMARY KEY NOT NULL,
	`mint_address` text NOT NULL,
	`preset` text NOT NULL,
	`name` text NOT NULL,
	`symbol` text NOT NULL,
	`decimals` integer DEFAULT 6 NOT NULL,
	`uri` text,
	`signature` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stablecoins_mint_address_unique` ON `stablecoins` (`mint_address`);--> statement-breakpoint
CREATE TABLE `subscribers` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`events` text NOT NULL,
	`created_at` integer NOT NULL
);
