ALTER TABLE "jobs" ADD COLUMN "deadline_at" timestamp with time zone;--> statement-breakpoint
UPDATE "jobs" SET "deadline_at" = "created_at" + ("duration_hours" || ' hours')::interval WHERE "deadline_at" IS NULL;--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "deadline_at" SET NOT NULL;--> statement-breakpoint
