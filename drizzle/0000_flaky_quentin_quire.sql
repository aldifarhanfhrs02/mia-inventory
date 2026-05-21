CREATE TABLE "users" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"nik" varchar(20) NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"must_change_password" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_nik_unique" UNIQUE("nik")
);
--> statement-breakpoint
CREATE TABLE "parts" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"part_code" varchar(50) NOT NULL,
	"part_name" varchar(200) NOT NULL,
	"maker" varchar(100) NOT NULL,
	"type" varchar(20) NOT NULL,
	"category" varchar(50) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"description" text,
	"remarks" text,
	"storage_type" varchar(5),
	"storage_number" integer,
	"storage_box" integer,
	"storage_box_kecil" integer,
	"barcode" varchar(10),
	"min_stock" integer DEFAULT 0 NOT NULL,
	"std_stock" integer,
	"max_stock" integer,
	"status" varchar(20) DEFAULT 'unassigned' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" varchar(36),
	"updated_by" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "parts_part_code_unique" UNIQUE("part_code")
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"part_id" varchar(36) NOT NULL,
	"type" varchar(10) NOT NULL,
	"quantity" integer NOT NULL,
	"stock_before" integer NOT NULL,
	"stock_after" integer NOT NULL,
	"requestor" varchar(100) NOT NULL,
	"inputer_nik" varchar(20) NOT NULL,
	"project" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quantity_positive" CHECK ("stock_movements"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "purchase_records" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"part_id" varchar(36) NOT NULL,
	"request_date" date NOT NULL,
	"status" varchar(20) DEFAULT 'requested' NOT NULL,
	"supplier" varchar(200),
	"po_number" varchar(100),
	"qty_ordered" integer NOT NULL,
	"expected_arrival" date,
	"received_date" date,
	"notes" text,
	"created_by" varchar(36),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "qty_ordered_positive" CHECK ("purchase_records"."qty_ordered" > 0)
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	CONSTRAINT "projects_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"action" varchar(50) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" varchar(36),
	"changes" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_logs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"row_count" integer NOT NULL,
	"summary" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_inputer_nik_users_nik_fk" FOREIGN KEY ("inputer_nik") REFERENCES "public"."users"("nik") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_records" ADD CONSTRAINT "purchase_records_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_records" ADD CONSTRAINT "purchase_records_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_logs" ADD CONSTRAINT "search_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_parts_barcode_active" ON "parts" USING btree ("barcode") WHERE "parts"."status" = 'active' AND "parts"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_parts_status_deleted" ON "parts" USING btree ("status","deleted_at") WHERE "parts"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_parts_part_name" ON "parts" USING btree ("part_name") WHERE "parts"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_parts_maker" ON "parts" USING btree ("maker") WHERE "parts"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_movements_part_created" ON "stock_movements" USING btree ("part_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_movements_created_type" ON "stock_movements" USING btree ("created_at","type");--> statement-breakpoint
CREATE INDEX "idx_purchase_status_eta" ON "purchase_records" USING btree ("status","expected_arrival");--> statement-breakpoint
CREATE INDEX "idx_activity_logs_created_at" ON "activity_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_activity_logs_action" ON "activity_logs" USING btree ("action","created_at");