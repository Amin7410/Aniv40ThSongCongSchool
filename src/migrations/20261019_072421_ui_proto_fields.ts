import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_yearbooks_state" AS ENUM('pending', 'processing', 'ready', 'error');
  CREATE TABLE "yearbooks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Kỷ yếu 40 năm (1986 – 2026)' NOT NULL,
  	"pdf_id" integer NOT NULL,
  	"published" boolean DEFAULT false,
  	"reprocess" boolean DEFAULT false,
  	"order" numeric DEFAULT 0,
  	"state" "enum_yearbooks_state" DEFAULT 'pending',
  	"state_note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "yearbooks_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  ALTER TABLE "site_settings" ALTER COLUMN "banner_text" SET DEFAULT 'Đảng Cộng sản Việt Nam quang vinh muôn năm';
  ALTER TABLE "exhibits" ADD COLUMN "art" jsonb;
  ALTER TABLE "_exhibits_v" ADD COLUMN "version_art" jsonb;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "yearbooks_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "tour3d_url" varchar;
  ALTER TABLE "yearbooks" ADD CONSTRAINT "yearbooks_pdf_id_media_id_fk" FOREIGN KEY ("pdf_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "yearbooks_rels" ADD CONSTRAINT "yearbooks_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."yearbooks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "yearbooks_rels" ADD CONSTRAINT "yearbooks_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "yearbooks_pdf_idx" ON "yearbooks" USING btree ("pdf_id");
  CREATE INDEX "yearbooks_updated_at_idx" ON "yearbooks" USING btree ("updated_at");
  CREATE INDEX "yearbooks_created_at_idx" ON "yearbooks" USING btree ("created_at");
  CREATE INDEX "yearbooks_rels_order_idx" ON "yearbooks_rels" USING btree ("order");
  CREATE INDEX "yearbooks_rels_parent_idx" ON "yearbooks_rels" USING btree ("parent_id");
  CREATE INDEX "yearbooks_rels_path_idx" ON "yearbooks_rels" USING btree ("path");
  CREATE INDEX "yearbooks_rels_media_id_idx" ON "yearbooks_rels" USING btree ("media_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_yearbooks_fk" FOREIGN KEY ("yearbooks_id") REFERENCES "public"."yearbooks"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_yearbooks_id_idx" ON "payload_locked_documents_rels" USING btree ("yearbooks_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "yearbooks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "yearbooks_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "yearbooks" CASCADE;
  DROP TABLE "yearbooks_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_yearbooks_fk";
  
  DROP INDEX "payload_locked_documents_rels_yearbooks_id_idx";
  ALTER TABLE "site_settings" ALTER COLUMN "banner_text" DROP DEFAULT;
  ALTER TABLE "exhibits" DROP COLUMN "art";
  ALTER TABLE "_exhibits_v" DROP COLUMN "version_art";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "yearbooks_id";
  ALTER TABLE "site_settings" DROP COLUMN "tour3d_url";
  DROP TYPE "public"."enum_yearbooks_state";`)
}
