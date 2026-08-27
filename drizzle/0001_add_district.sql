ALTER TABLE "users" ADD COLUMN "district" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "district" text;--> statement-breakpoint
CREATE INDEX "users_district_idx" ON "users" USING btree ("district");--> statement-breakpoint
CREATE INDEX "jobs_district_idx" ON "jobs" USING btree ("district");--> statement-breakpoint
CREATE INDEX "jobs_city_idx" ON "jobs" USING btree ("city");--> statement-breakpoint
CREATE INDEX "users_city_idx" ON "users" USING btree ("city");--> statement-breakpoint
