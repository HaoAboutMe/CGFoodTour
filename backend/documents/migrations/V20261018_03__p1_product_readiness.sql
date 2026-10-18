-- Forward-only MySQL migration for the P1 product-readiness implementation.
-- Run on a schema copy first. MySQL does not support portable IF NOT EXISTS for every
-- ALTER/INDEX form, so verify existing columns and indexes before production execution.

CREATE INDEX `idx_invalidated_token_expiry`
    ON `invalidated_token` (`expiry_time`);

CREATE INDEX `idx_password_reset_otp_cleanup`
    ON `password_reset_otp` (`expiry_date`, `is_used`, `created_at`);

CREATE INDEX `idx_verification_token_cleanup`
    ON `verification_token` (`expiry_date`);

CREATE INDEX `idx_stores_status_category_created`
    ON `stores` (`status`, `category_id`, `created_at`);

CREATE INDEX `idx_stores_status_coordinates`
    ON `stores` (`status`, `latitude`, `longitude`);

ALTER TABLE `media_cleanup_tasks`
    ADD COLUMN `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `next_attempt_at` DATETIME(6) NULL;

UPDATE `media_cleanup_tasks`
SET `next_attempt_at` = COALESCE(`last_attempt_at`, `created_at`, CURRENT_TIMESTAMP(6))
WHERE `next_attempt_at` IS NULL;

CREATE INDEX `idx_media_cleanup_due`
    ON `media_cleanup_tasks` (`status`, `next_attempt_at`);

-- Required unique constraints (confirm names/existence on the real schema before running):
-- ALTER TABLE `store_ratings` ADD CONSTRAINT `uq_user_store_rating` UNIQUE (`user_id`, `store_id`);
-- ALTER TABLE `user_saved_stores` ADD CONSTRAINT `uq_user_saved_store` UNIQUE (`user_id`, `store_id`);
-- ALTER TABLE `store_daily_reports` ADD CONSTRAINT `uq_user_daily_report`
--     UNIQUE (`user_id`, `store_id`, `report_date`);

-- Manual rollback runbook:
-- DROP INDEX `idx_invalidated_token_expiry` ON `invalidated_token`;
-- DROP INDEX `idx_password_reset_otp_cleanup` ON `password_reset_otp`;
-- DROP INDEX `idx_verification_token_cleanup` ON `verification_token`;
-- DROP INDEX `idx_stores_status_category_created` ON `stores`;
-- DROP INDEX `idx_stores_status_coordinates` ON `stores`;
-- DROP INDEX `idx_media_cleanup_due` ON `media_cleanup_tasks`;
-- ALTER TABLE `media_cleanup_tasks` DROP COLUMN `next_attempt_at`, DROP COLUMN `status`;
