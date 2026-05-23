ALTER TABLE "parts" ADD COLUMN "part_class" varchar(30) DEFAULT 'consumable' NOT NULL;
--> statement-breakpoint
-- Backfill: storage cabinets now only A (Lemari) and B (Rak); collapse C/D/E → B.
UPDATE "parts" SET "storage_type" = 'B' WHERE "storage_type" IN ('C','D','E');
--> statement-breakpoint
-- Backfill: units are Title Case (Pcs / Set / …) — rename uppercase legacy values.
UPDATE "parts" SET "unit" = 'Pcs' WHERE "unit" = 'PCS';
--> statement-breakpoint
UPDATE "parts" SET "unit" = 'Set' WHERE "unit" = 'SET';
--> statement-breakpoint
UPDATE "parts" SET "unit" = 'Mtr' WHERE "unit" = 'MTR';
--> statement-breakpoint
UPDATE "parts" SET "unit" = 'Kg'  WHERE "unit" = 'KG';
--> statement-breakpoint
UPDATE "parts" SET "unit" = 'Lbr' WHERE "unit" = 'LBR';
--> statement-breakpoint
UPDATE "parts" SET "unit" = 'Btg' WHERE "unit" = 'BTG';
--> statement-breakpoint
UPDATE "parts" SET "unit" = 'Rol' WHERE "unit" = 'ROL';
--> statement-breakpoint
UPDATE "parts" SET "unit" = 'Pak' WHERE "unit" = 'PAK';
