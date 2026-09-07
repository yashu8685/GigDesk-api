ALTER TYPE "public"."assignment_status" ADD VALUE 'pending' BEFORE 'active';--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email") WHERE email IS NOT NULL AND user_type = 'admin';