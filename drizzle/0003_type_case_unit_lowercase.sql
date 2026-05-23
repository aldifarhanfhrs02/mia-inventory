-- Re-case enum-style string values stored in `parts`:
--   • Type: "electrical" → "Electrical" (Title Case)
--   • Unit: "Pcs" → "pcs" (all lowercase)
UPDATE "parts" SET "type" = 'Electrical'  WHERE "type" = 'electrical';
--> statement-breakpoint
UPDATE "parts" SET "type" = 'Mechanical'  WHERE "type" = 'mechanical';
--> statement-breakpoint
UPDATE "parts" SET "type" = 'Fabrication' WHERE "type" = 'fabrication';
--> statement-breakpoint
UPDATE "parts" SET "unit" = 'pcs' WHERE "unit" = 'Pcs';
--> statement-breakpoint
UPDATE "parts" SET "unit" = 'set' WHERE "unit" = 'Set';
--> statement-breakpoint
UPDATE "parts" SET "unit" = 'mtr' WHERE "unit" = 'Mtr';
--> statement-breakpoint
UPDATE "parts" SET "unit" = 'kg'  WHERE "unit" = 'Kg';
--> statement-breakpoint
UPDATE "parts" SET "unit" = 'lbr' WHERE "unit" = 'Lbr';
--> statement-breakpoint
UPDATE "parts" SET "unit" = 'btg' WHERE "unit" = 'Btg';
--> statement-breakpoint
UPDATE "parts" SET "unit" = 'rol' WHERE "unit" = 'Rol';
--> statement-breakpoint
UPDATE "parts" SET "unit" = 'pak' WHERE "unit" = 'Pak';
