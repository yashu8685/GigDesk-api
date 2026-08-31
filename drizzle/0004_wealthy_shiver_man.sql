ALTER TABLE "users" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_photo_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "driving_license_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_available" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_lat" double precision;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_lng" double precision;