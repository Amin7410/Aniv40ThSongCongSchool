import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN "totp_enabled" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN "reset_totp" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN "totp_secret_enc" varchar;
  ALTER TABLE "users" ADD COLUMN "totp_pending_enc" varchar;
  ALTER TABLE "users" ADD COLUMN "totp_last_step" numeric DEFAULT 0;
  ALTER TABLE "users" ADD COLUMN "recovery_hashes" jsonb;
  -- Nhật ký thao tác bất biến ở tầng CSDL: chặn UPDATE/DELETE kể cả khi ứng dụng bị chiếm quyền.
  -- Ngoại lệ duy nhất: khi xóa tài khoản, khóa ngoại đặt actor_id = NULL (giữ nguyên nội dung nhật ký).
  CREATE OR REPLACE FUNCTION audit_logs_immutable() RETURNS trigger AS $$
  BEGIN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'audit_logs là chỉ-ghi-thêm (không được xóa)';
    END IF;
    IF NEW.actor_id IS NULL AND OLD.actor_id IS NOT NULL
       AND (to_jsonb(NEW) - 'actor_id' - 'updated_at') = (to_jsonb(OLD) - 'actor_id' - 'updated_at') THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'audit_logs là chỉ-ghi-thêm (không được sửa)';
  END;
  $$ LANGUAGE plpgsql;
  DROP TRIGGER IF EXISTS audit_logs_immutable ON "audit_logs";
  CREATE TRIGGER audit_logs_immutable BEFORE UPDATE OR DELETE ON "audit_logs"
    FOR EACH ROW EXECUTE FUNCTION audit_logs_immutable();
  DROP TRIGGER IF EXISTS audit_logs_no_truncate ON "audit_logs";
  CREATE TRIGGER audit_logs_no_truncate BEFORE TRUNCATE ON "audit_logs"
    FOR EACH STATEMENT EXECUTE FUNCTION audit_logs_immutable();`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" DROP COLUMN "totp_enabled";
  ALTER TABLE "users" DROP COLUMN "reset_totp";
  ALTER TABLE "users" DROP COLUMN "totp_secret_enc";
  ALTER TABLE "users" DROP COLUMN "totp_pending_enc";
  ALTER TABLE "users" DROP COLUMN "totp_last_step";
  ALTER TABLE "users" DROP COLUMN "recovery_hashes";
  DROP TRIGGER IF EXISTS audit_logs_immutable ON "audit_logs";
  DROP TRIGGER IF EXISTS audit_logs_no_truncate ON "audit_logs";
  DROP FUNCTION IF EXISTS audit_logs_immutable();`)
}
