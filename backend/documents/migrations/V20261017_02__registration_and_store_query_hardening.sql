-- Forward-only MySQL migration for registration lifecycle and paginated store queries.
-- Review against the real schema before production execution.

ALTER TABLE `user`
    ADD COLUMN `registration_ip_hash` VARCHAR(64) NULL,
    ADD COLUMN `pending_verification_expires_at` DATETIME(6) NULL;

CREATE INDEX `idx_user_pending_verification`
    ON `user` (`email_verified`, `enabled`, `pending_verification_expires_at`);

CREATE INDEX `idx_user_registration_source`
    ON `user` (`registration_ip_hash`, `email_verified`, `pending_verification_expires_at`);

CREATE INDEX `idx_store_status_owner_created`
    ON `store` (`status`, `owner_id`, `created_at`);

CREATE INDEX `idx_store_category_status_created`
    ON `store` (`category_id`, `status`, `created_at`);

CREATE INDEX `idx_food_item_store`
    ON `food_item` (`store_id`);

CREATE INDEX `idx_store_daily_report_store_date`
    ON `store_daily_reports` (`store_id`, `report_date`);

CREATE INDEX `idx_saved_store_user_date`
    ON `user_saved_stores` (`user_id`, `saved_at`);
