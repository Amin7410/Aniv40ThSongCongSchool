import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_zones_type" AS ENUM('leaders', 'staff', 'alumni', 'awards', 'gallery', 'campus', 'memories');
  CREATE TYPE "public"."enum_exhibits_staff_status" AS ENUM('current', 'retired', 'moved');
  CREATE TYPE "public"."enum_exhibits_award_kind" AS ENUM('medal', 'flag', 'cup', 'cert');
  CREATE TYPE "public"."enum_exhibits_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__exhibits_v_version_staff_status" AS ENUM('current', 'retired', 'moved');
  CREATE TYPE "public"."enum__exhibits_v_version_award_kind" AS ENUM('medal', 'flag', 'cup', 'cert');
  CREATE TYPE "public"."enum__exhibits_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_submissions_kind" AS ENUM('guestbook', 'memory', 'photo', 'tribute', 'pin', 'donation');
  CREATE TYPE "public"."enum_submissions_status" AS ENUM('pending', 'approved', 'rejected', 'hidden');
  CREATE TYPE "public"."enum_users_role" AS ENUM('super', 'school_admin', 'editor', 'moderator', 'accountant');
  CREATE TYPE "public"."enum_event_settings_live_mode" AS ENUM('auto', 'on', 'off');
  CREATE TABLE "zones" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"short_title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"type" "enum_zones_type" NOT NULL,
  	"description" varchar,
  	"order" numeric DEFAULT 0,
  	"cover_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "zones_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "exhibits" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"zone_id" integer,
  	"title" varchar,
  	"subtitle" varchar,
  	"category" varchar,
  	"year" numeric,
  	"year_start" numeric,
  	"year_end" numeric,
  	"staff_status" "enum_exhibits_staff_status",
  	"award_kind" "enum_exhibits_award_kind",
  	"awarded_by" varchar,
  	"memory_type" varchar,
  	"cohort" varchar,
  	"contributor" varchar,
  	"description" varchar,
  	"pair_key" varchar,
  	"sort_order" numeric DEFAULT 100,
  	"generation" varchar,
  	"search_text" varchar,
  	"source_submission_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_exhibits_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "exhibits_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "exhibits_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_exhibits_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_zone_id" integer,
  	"version_title" varchar,
  	"version_subtitle" varchar,
  	"version_category" varchar,
  	"version_year" numeric,
  	"version_year_start" numeric,
  	"version_year_end" numeric,
  	"version_staff_status" "enum__exhibits_v_version_staff_status",
  	"version_award_kind" "enum__exhibits_v_version_award_kind",
  	"version_awarded_by" varchar,
  	"version_memory_type" varchar,
  	"version_cohort" varchar,
  	"version_contributor" varchar,
  	"version_description" varchar,
  	"version_pair_key" varchar,
  	"version_sort_order" numeric DEFAULT 100,
  	"version_generation" varchar,
  	"version_search_text" varchar,
  	"version_source_submission_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__exhibits_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_exhibits_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_exhibits_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "milestones" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "quiz_questions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"correct_index" numeric NOT NULL,
  	"explanation" varchar,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "quiz_questions_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"credit" varchar,
  	"is_historical" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_full_url" varchar,
  	"sizes_full_width" numeric,
  	"sizes_full_height" numeric,
  	"sizes_full_mime_type" varchar,
  	"sizes_full_filesize" numeric,
  	"sizes_full_filename" varchar
  );
  
  CREATE TABLE "submissions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum_submissions_kind" NOT NULL,
  	"status" "enum_submissions_status" DEFAULT 'pending' NOT NULL,
  	"name" varchar NOT NULL,
  	"cohort" varchar,
  	"contact" varchar,
  	"message" varchar,
  	"payload" jsonb,
  	"tribute_to_id" integer,
  	"city_id" integer,
  	"target_zone_id" integer,
  	"publish_title" varchar,
  	"published_as_id" integer,
  	"confirmed_amount" numeric,
  	"reject_reason" varchar,
  	"consent_version" varchar,
  	"moderated_by_id" integer,
  	"moderated_at" timestamp(3) with time zone,
  	"ip_hash" varchar,
  	"edit_token_hash" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "submissions_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "submissions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"submission_files_id" integer
  );
  
  CREATE TABLE "submission_files" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar
  );
  
  CREATE TABLE "candles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"fp" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cities" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"country" varchar NOT NULL,
  	"lat" numeric NOT NULL,
  	"lng" numeric NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'editor' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "users_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"zones_id" integer
  );
  
  CREATE TABLE "audit_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"actor_id" integer,
  	"actor_label" varchar,
  	"action" varchar NOT NULL,
  	"target" varchar,
  	"doc_id" varchar,
  	"before" jsonb,
  	"after" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"zones_id" integer,
  	"exhibits_id" integer,
  	"milestones_id" integer,
  	"quiz_questions_id" integer,
  	"media_id" integer,
  	"submissions_id" integer,
  	"submission_files_id" integer,
  	"candles_id" integer,
  	"cities_id" integer,
  	"users_id" integer,
  	"audit_logs_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"school_name" varchar DEFAULT 'Trường THPT Sông Công' NOT NULL,
  	"founded_date" timestamp(3) with time zone DEFAULT '1986-07-05' NOT NULL,
  	"decision_no" varchar,
  	"decision_issuer" varchar,
  	"decision_scan_id" integer,
  	"banner_text" varchar,
  	"music_id" integer,
  	"music_title" varchar DEFAULT 'Bài ca truyền thống của trường',
  	"contact_email" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_settings_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "event_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Lễ kỷ niệm 40 năm thành lập trường',
  	"starts_at" timestamp(3) with time zone DEFAULT '2026-11-20T00:30:00.000Z',
  	"place" varchar DEFAULT 'Sân trường',
  	"live_url" varchar,
  	"live_mode" "enum_event_settings_live_mode" DEFAULT 'auto',
  	"live_hours" numeric DEFAULT 4,
  	"campaign_start" timestamp(3) with time zone DEFAULT '2026-09-20',
  	"campaign_end" timestamp(3) with time zone DEFAULT '2026-11-19',
  	"submissions_open" boolean DEFAULT true,
  	"static_fallback" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "fund_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar DEFAULT 'Quỹ học bổng 40 năm',
  	"goal" numeric DEFAULT 200000000,
  	"transfer_prefix" varchar DEFAULT 'QHB40',
  	"bank_bin" varchar,
  	"bank_name" varchar,
  	"account_no" varchar,
  	"account_name" varchar,
  	"last_approved_by_id" integer,
  	"last_approved_at" timestamp(3) with time zone,
  	"proposal_bank_bin" varchar,
  	"proposal_bank_name" varchar,
  	"proposal_account_no" varchar,
  	"proposal_account_name" varchar,
  	"proposal_proposed_by_id" integer,
  	"proposal_proposed_at" timestamp(3) with time zone,
  	"approve_proposal" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "zones" ADD CONSTRAINT "zones_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "zones_texts" ADD CONSTRAINT "zones_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exhibits" ADD CONSTRAINT "exhibits_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "exhibits" ADD CONSTRAINT "exhibits_source_submission_id_submissions_id_fk" FOREIGN KEY ("source_submission_id") REFERENCES "public"."submissions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "exhibits_texts" ADD CONSTRAINT "exhibits_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."exhibits"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exhibits_rels" ADD CONSTRAINT "exhibits_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."exhibits"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exhibits_rels" ADD CONSTRAINT "exhibits_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_exhibits_v" ADD CONSTRAINT "_exhibits_v_parent_id_exhibits_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."exhibits"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_exhibits_v" ADD CONSTRAINT "_exhibits_v_version_zone_id_zones_id_fk" FOREIGN KEY ("version_zone_id") REFERENCES "public"."zones"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_exhibits_v" ADD CONSTRAINT "_exhibits_v_version_source_submission_id_submissions_id_fk" FOREIGN KEY ("version_source_submission_id") REFERENCES "public"."submissions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_exhibits_v_texts" ADD CONSTRAINT "_exhibits_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_exhibits_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_exhibits_v_rels" ADD CONSTRAINT "_exhibits_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_exhibits_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_exhibits_v_rels" ADD CONSTRAINT "_exhibits_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "quiz_questions_texts" ADD CONSTRAINT "quiz_questions_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "submissions" ADD CONSTRAINT "submissions_tribute_to_id_exhibits_id_fk" FOREIGN KEY ("tribute_to_id") REFERENCES "public"."exhibits"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "submissions" ADD CONSTRAINT "submissions_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "submissions" ADD CONSTRAINT "submissions_target_zone_id_zones_id_fk" FOREIGN KEY ("target_zone_id") REFERENCES "public"."zones"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "submissions" ADD CONSTRAINT "submissions_published_as_id_exhibits_id_fk" FOREIGN KEY ("published_as_id") REFERENCES "public"."exhibits"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "submissions" ADD CONSTRAINT "submissions_moderated_by_id_users_id_fk" FOREIGN KEY ("moderated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "submissions_texts" ADD CONSTRAINT "submissions_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "submissions_rels" ADD CONSTRAINT "submissions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "submissions_rels" ADD CONSTRAINT "submissions_rels_submission_files_fk" FOREIGN KEY ("submission_files_id") REFERENCES "public"."submission_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_zones_fk" FOREIGN KEY ("zones_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_zones_fk" FOREIGN KEY ("zones_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_exhibits_fk" FOREIGN KEY ("exhibits_id") REFERENCES "public"."exhibits"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_milestones_fk" FOREIGN KEY ("milestones_id") REFERENCES "public"."milestones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_quiz_questions_fk" FOREIGN KEY ("quiz_questions_id") REFERENCES "public"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_submissions_fk" FOREIGN KEY ("submissions_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_submission_files_fk" FOREIGN KEY ("submission_files_id") REFERENCES "public"."submission_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_candles_fk" FOREIGN KEY ("candles_id") REFERENCES "public"."candles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cities_fk" FOREIGN KEY ("cities_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_logs_fk" FOREIGN KEY ("audit_logs_id") REFERENCES "public"."audit_logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_decision_scan_id_media_id_fk" FOREIGN KEY ("decision_scan_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_music_id_media_id_fk" FOREIGN KEY ("music_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_texts" ADD CONSTRAINT "site_settings_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "fund_settings" ADD CONSTRAINT "fund_settings_last_approved_by_id_users_id_fk" FOREIGN KEY ("last_approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "fund_settings" ADD CONSTRAINT "fund_settings_proposal_proposed_by_id_users_id_fk" FOREIGN KEY ("proposal_proposed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "zones_slug_idx" ON "zones" USING btree ("slug");
  CREATE INDEX "zones_cover_idx" ON "zones" USING btree ("cover_id");
  CREATE INDEX "zones_updated_at_idx" ON "zones" USING btree ("updated_at");
  CREATE INDEX "zones_created_at_idx" ON "zones" USING btree ("created_at");
  CREATE INDEX "zones_texts_order_parent" ON "zones_texts" USING btree ("order","parent_id");
  CREATE INDEX "exhibits_zone_idx" ON "exhibits" USING btree ("zone_id");
  CREATE INDEX "exhibits_category_idx" ON "exhibits" USING btree ("category");
  CREATE INDEX "exhibits_sort_order_idx" ON "exhibits" USING btree ("sort_order");
  CREATE INDEX "exhibits_generation_idx" ON "exhibits" USING btree ("generation");
  CREATE INDEX "exhibits_source_submission_idx" ON "exhibits" USING btree ("source_submission_id");
  CREATE INDEX "exhibits_updated_at_idx" ON "exhibits" USING btree ("updated_at");
  CREATE INDEX "exhibits_created_at_idx" ON "exhibits" USING btree ("created_at");
  CREATE INDEX "exhibits__status_idx" ON "exhibits" USING btree ("_status");
  CREATE INDEX "exhibits_texts_order_parent" ON "exhibits_texts" USING btree ("order","parent_id");
  CREATE INDEX "exhibits_rels_order_idx" ON "exhibits_rels" USING btree ("order");
  CREATE INDEX "exhibits_rels_parent_idx" ON "exhibits_rels" USING btree ("parent_id");
  CREATE INDEX "exhibits_rels_path_idx" ON "exhibits_rels" USING btree ("path");
  CREATE INDEX "exhibits_rels_media_id_idx" ON "exhibits_rels" USING btree ("media_id");
  CREATE INDEX "_exhibits_v_parent_idx" ON "_exhibits_v" USING btree ("parent_id");
  CREATE INDEX "_exhibits_v_version_version_zone_idx" ON "_exhibits_v" USING btree ("version_zone_id");
  CREATE INDEX "_exhibits_v_version_version_category_idx" ON "_exhibits_v" USING btree ("version_category");
  CREATE INDEX "_exhibits_v_version_version_sort_order_idx" ON "_exhibits_v" USING btree ("version_sort_order");
  CREATE INDEX "_exhibits_v_version_version_generation_idx" ON "_exhibits_v" USING btree ("version_generation");
  CREATE INDEX "_exhibits_v_version_version_source_submission_idx" ON "_exhibits_v" USING btree ("version_source_submission_id");
  CREATE INDEX "_exhibits_v_version_version_updated_at_idx" ON "_exhibits_v" USING btree ("version_updated_at");
  CREATE INDEX "_exhibits_v_version_version_created_at_idx" ON "_exhibits_v" USING btree ("version_created_at");
  CREATE INDEX "_exhibits_v_version_version__status_idx" ON "_exhibits_v" USING btree ("version__status");
  CREATE INDEX "_exhibits_v_created_at_idx" ON "_exhibits_v" USING btree ("created_at");
  CREATE INDEX "_exhibits_v_updated_at_idx" ON "_exhibits_v" USING btree ("updated_at");
  CREATE INDEX "_exhibits_v_latest_idx" ON "_exhibits_v" USING btree ("latest");
  CREATE INDEX "_exhibits_v_texts_order_parent" ON "_exhibits_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "_exhibits_v_rels_order_idx" ON "_exhibits_v_rels" USING btree ("order");
  CREATE INDEX "_exhibits_v_rels_parent_idx" ON "_exhibits_v_rels" USING btree ("parent_id");
  CREATE INDEX "_exhibits_v_rels_path_idx" ON "_exhibits_v_rels" USING btree ("path");
  CREATE INDEX "_exhibits_v_rels_media_id_idx" ON "_exhibits_v_rels" USING btree ("media_id");
  CREATE INDEX "milestones_updated_at_idx" ON "milestones" USING btree ("updated_at");
  CREATE INDEX "milestones_created_at_idx" ON "milestones" USING btree ("created_at");
  CREATE INDEX "quiz_questions_updated_at_idx" ON "quiz_questions" USING btree ("updated_at");
  CREATE INDEX "quiz_questions_created_at_idx" ON "quiz_questions" USING btree ("created_at");
  CREATE INDEX "quiz_questions_texts_order_parent" ON "quiz_questions_texts" USING btree ("order","parent_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_full_sizes_full_filename_idx" ON "media" USING btree ("sizes_full_filename");
  CREATE INDEX "submissions_kind_idx" ON "submissions" USING btree ("kind");
  CREATE INDEX "submissions_status_idx" ON "submissions" USING btree ("status");
  CREATE INDEX "submissions_tribute_to_idx" ON "submissions" USING btree ("tribute_to_id");
  CREATE INDEX "submissions_city_idx" ON "submissions" USING btree ("city_id");
  CREATE INDEX "submissions_target_zone_idx" ON "submissions" USING btree ("target_zone_id");
  CREATE INDEX "submissions_published_as_idx" ON "submissions" USING btree ("published_as_id");
  CREATE INDEX "submissions_moderated_by_idx" ON "submissions" USING btree ("moderated_by_id");
  CREATE INDEX "submissions_ip_hash_idx" ON "submissions" USING btree ("ip_hash");
  CREATE INDEX "submissions_edit_token_hash_idx" ON "submissions" USING btree ("edit_token_hash");
  CREATE INDEX "submissions_updated_at_idx" ON "submissions" USING btree ("updated_at");
  CREATE INDEX "submissions_created_at_idx" ON "submissions" USING btree ("created_at");
  CREATE INDEX "submissions_texts_order_parent" ON "submissions_texts" USING btree ("order","parent_id");
  CREATE INDEX "submissions_rels_order_idx" ON "submissions_rels" USING btree ("order");
  CREATE INDEX "submissions_rels_parent_idx" ON "submissions_rels" USING btree ("parent_id");
  CREATE INDEX "submissions_rels_path_idx" ON "submissions_rels" USING btree ("path");
  CREATE INDEX "submissions_rels_submission_files_id_idx" ON "submissions_rels" USING btree ("submission_files_id");
  CREATE INDEX "submission_files_updated_at_idx" ON "submission_files" USING btree ("updated_at");
  CREATE INDEX "submission_files_created_at_idx" ON "submission_files" USING btree ("created_at");
  CREATE UNIQUE INDEX "submission_files_filename_idx" ON "submission_files" USING btree ("filename");
  CREATE INDEX "submission_files_sizes_thumb_sizes_thumb_filename_idx" ON "submission_files" USING btree ("sizes_thumb_filename");
  CREATE UNIQUE INDEX "candles_fp_idx" ON "candles" USING btree ("fp");
  CREATE INDEX "candles_updated_at_idx" ON "candles" USING btree ("updated_at");
  CREATE INDEX "candles_created_at_idx" ON "candles" USING btree ("created_at");
  CREATE UNIQUE INDEX "cities_code_idx" ON "cities" USING btree ("code");
  CREATE INDEX "cities_updated_at_idx" ON "cities" USING btree ("updated_at");
  CREATE INDEX "cities_created_at_idx" ON "cities" USING btree ("created_at");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "users_rels_order_idx" ON "users_rels" USING btree ("order");
  CREATE INDEX "users_rels_parent_idx" ON "users_rels" USING btree ("parent_id");
  CREATE INDEX "users_rels_path_idx" ON "users_rels" USING btree ("path");
  CREATE INDEX "users_rels_zones_id_idx" ON "users_rels" USING btree ("zones_id");
  CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_id");
  CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");
  CREATE INDEX "audit_logs_target_idx" ON "audit_logs" USING btree ("target");
  CREATE INDEX "audit_logs_updated_at_idx" ON "audit_logs" USING btree ("updated_at");
  CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_zones_id_idx" ON "payload_locked_documents_rels" USING btree ("zones_id");
  CREATE INDEX "payload_locked_documents_rels_exhibits_id_idx" ON "payload_locked_documents_rels" USING btree ("exhibits_id");
  CREATE INDEX "payload_locked_documents_rels_milestones_id_idx" ON "payload_locked_documents_rels" USING btree ("milestones_id");
  CREATE INDEX "payload_locked_documents_rels_quiz_questions_id_idx" ON "payload_locked_documents_rels" USING btree ("quiz_questions_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_submissions_id_idx" ON "payload_locked_documents_rels" USING btree ("submissions_id");
  CREATE INDEX "payload_locked_documents_rels_submission_files_id_idx" ON "payload_locked_documents_rels" USING btree ("submission_files_id");
  CREATE INDEX "payload_locked_documents_rels_candles_id_idx" ON "payload_locked_documents_rels" USING btree ("candles_id");
  CREATE INDEX "payload_locked_documents_rels_cities_id_idx" ON "payload_locked_documents_rels" USING btree ("cities_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_audit_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_logs_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_decision_scan_idx" ON "site_settings" USING btree ("decision_scan_id");
  CREATE INDEX "site_settings_music_idx" ON "site_settings" USING btree ("music_id");
  CREATE INDEX "site_settings_texts_order_parent" ON "site_settings_texts" USING btree ("order","parent_id");
  CREATE INDEX "fund_settings_last_approved_by_idx" ON "fund_settings" USING btree ("last_approved_by_id");
  CREATE INDEX "fund_settings_proposal_proposal_proposed_by_idx" ON "fund_settings" USING btree ("proposal_proposed_by_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "zones" CASCADE;
  DROP TABLE "zones_texts" CASCADE;
  DROP TABLE "exhibits" CASCADE;
  DROP TABLE "exhibits_texts" CASCADE;
  DROP TABLE "exhibits_rels" CASCADE;
  DROP TABLE "_exhibits_v" CASCADE;
  DROP TABLE "_exhibits_v_texts" CASCADE;
  DROP TABLE "_exhibits_v_rels" CASCADE;
  DROP TABLE "milestones" CASCADE;
  DROP TABLE "quiz_questions" CASCADE;
  DROP TABLE "quiz_questions_texts" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "submissions" CASCADE;
  DROP TABLE "submissions_texts" CASCADE;
  DROP TABLE "submissions_rels" CASCADE;
  DROP TABLE "submission_files" CASCADE;
  DROP TABLE "candles" CASCADE;
  DROP TABLE "cities" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "users_rels" CASCADE;
  DROP TABLE "audit_logs" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "site_settings_texts" CASCADE;
  DROP TABLE "event_settings" CASCADE;
  DROP TABLE "fund_settings" CASCADE;
  DROP TYPE "public"."enum_zones_type";
  DROP TYPE "public"."enum_exhibits_staff_status";
  DROP TYPE "public"."enum_exhibits_award_kind";
  DROP TYPE "public"."enum_exhibits_status";
  DROP TYPE "public"."enum__exhibits_v_version_staff_status";
  DROP TYPE "public"."enum__exhibits_v_version_award_kind";
  DROP TYPE "public"."enum__exhibits_v_version_status";
  DROP TYPE "public"."enum_submissions_kind";
  DROP TYPE "public"."enum_submissions_status";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_event_settings_live_mode";`)
}
