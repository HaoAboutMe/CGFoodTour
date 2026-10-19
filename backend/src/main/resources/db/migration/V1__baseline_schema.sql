-- Canonical greenfield schema for CG FoodTour.
-- Existing databases must be compared with this schema on a restored copy before
-- recording a Flyway baseline. Never enable baselineOnMigrate automatically.

CREATE TABLE `permission` (
    `name` VARCHAR(255) NOT NULL,
    `description` VARCHAR(255) NULL,
    PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `role` (
    `name` VARCHAR(255) NOT NULL,
    `description` VARCHAR(255) NULL,
    PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `role_permissions` (
    `role_name` VARCHAR(255) NOT NULL,
    `permissions_name` VARCHAR(255) NOT NULL,
    PRIMARY KEY (`role_name`, `permissions_name`),
    CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_name`) REFERENCES `role` (`name`),
    CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permissions_name`) REFERENCES `permission` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user` (
    `id` VARCHAR(255) NOT NULL,
    `username` VARCHAR(255) NULL,
    `firstname` VARCHAR(255) NULL,
    `lastname` VARCHAR(255) NULL,
    `email` VARCHAR(255) NULL,
    `password` VARCHAR(255) NULL,
    `date_of_birth` DATE NULL,
    `avatar_url` VARCHAR(255) NULL,
    `avatar_public_id` VARCHAR(255) NULL,
    `google_id` VARCHAR(255) NULL,
    `facebook_id` VARCHAR(255) NULL,
    `token_version` BIGINT NULL DEFAULT 0,
    `enabled` BIT NULL DEFAULT 0,
    `email_verified` BIT NULL DEFAULT 0,
    `disabled_reason` VARCHAR(1000) NULL,
    `disabled_at` DATETIME(6) NULL,
    `disabled_by_admin_id` VARCHAR(255) NULL,
    `registration_ip_hash` VARCHAR(64) NULL,
    `pending_verification_expires_at` DATETIME(6) NULL,
    `created_at` DATETIME(6) NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_user_username` UNIQUE (`username`),
    CONSTRAINT `uk_user_email` UNIQUE (`email`),
    CONSTRAINT `uk_user_google_id` UNIQUE (`google_id`),
    CONSTRAINT `uk_user_facebook_id` UNIQUE (`facebook_id`),
    INDEX `idx_user_pending_verification` (`email_verified`, `enabled`, `pending_verification_expires_at`),
    INDEX `idx_user_registration_source` (`registration_ip_hash`, `email_verified`, `pending_verification_expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_roles` (
    `user_id` VARCHAR(255) NOT NULL,
    `roles_name` VARCHAR(255) NOT NULL,
    PRIMARY KEY (`user_id`, `roles_name`),
    CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
    CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`roles_name`) REFERENCES `role` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `categories` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `icon_url` VARCHAR(255) NULL,
    `display_order` INT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_categories_name` UNIQUE (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `stores` (
    `id` VARCHAR(255) NOT NULL,
    `category_id` INT NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `phone_number` VARCHAR(20) NULL,
    `address_line` VARCHAR(255) NOT NULL,
    `landmark_note` VARCHAR(255) NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `map_url` VARCHAR(1000) NULL,
    `open_time` TIME(6) NOT NULL,
    `close_time` TIME(6) NOT NULL,
    `price_min` DOUBLE NULL DEFAULT 0,
    `price_max` DOUBLE NULL DEFAULT 0,
    `banner_image_url` VARCHAR(255) NULL,
    `banner_image_public_id` VARCHAR(255) NULL,
    `is_verified` BIT NULL DEFAULT 0,
    `owner_id` VARCHAR(255) NULL,
    `status` ENUM('APPROVED','HIDDEN','PENDING','REJECTED') NOT NULL DEFAULT 'PENDING',
    `rejection_reason` VARCHAR(255) NULL,
    `hidden_by_admin` BIT NULL DEFAULT 0,
    `recovery_requested` BIT NULL DEFAULT 0,
    `recovery_request_reason` TEXT NULL,
    `recovery_decline_reason` TEXT NULL,
    `hide_reason` TEXT NULL,
    `count_very_satisfied` INT NULL DEFAULT 0,
    `count_normal` INT NULL DEFAULT 0,
    `count_not_satisfied` INT NULL DEFAULT 0,
    `total_votes` INT NULL DEFAULT 0,
    `satisfaction_rate` DOUBLE NULL DEFAULT 0,
    `saved_count` INT NULL DEFAULT 0,
    `created_at` DATETIME(6) NULL,
    `updated_at` DATETIME(6) NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_stores_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
    CONSTRAINT `fk_stores_owner` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`),
    INDEX `idx_stores_status_owner_created` (`status`, `owner_id`, `created_at`),
    INDEX `idx_stores_category_status_created` (`category_id`, `status`, `created_at`),
    INDEX `idx_stores_status_coordinates` (`status`, `latitude`, `longitude`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `food_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `store_id` VARCHAR(255) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `price` DOUBLE NOT NULL,
    `image_url` VARCHAR(255) NULL,
    `image_public_id` VARCHAR(255) NULL,
    `description` VARCHAR(255) NULL,
    `is_signature` BIT NULL DEFAULT 0,
    `created_at` DATETIME(6) NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_food_items_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`),
    INDEX `idx_food_items_store` (`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `store_ratings` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(255) NOT NULL,
    `store_id` VARCHAR(255) NOT NULL,
    `rating_level` ENUM('NORMAL','NOT_SATISFIED','VERY_SATISFIED') NOT NULL,
    `created_at` DATETIME(6) NULL,
    `updated_at` DATETIME(6) NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `uq_user_store_rating` UNIQUE (`user_id`, `store_id`),
    CONSTRAINT `fk_store_ratings_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_saved_stores` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(255) NOT NULL,
    `store_id` VARCHAR(255) NOT NULL,
    `saved_at` DATETIME(6) NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `uq_user_saved_store` UNIQUE (`user_id`, `store_id`),
    CONSTRAINT `fk_saved_store_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
    CONSTRAINT `fk_saved_store_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`),
    INDEX `idx_saved_store_user_date` (`user_id`, `saved_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `store_daily_reports` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(255) NOT NULL,
    `store_id` VARCHAR(255) NOT NULL,
    `report_date` DATE NOT NULL,
    `created_at` DATETIME(6) NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `uq_user_daily_report` UNIQUE (`user_id`, `store_id`, `report_date`),
    CONSTRAINT `fk_store_daily_reports_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`),
    INDEX `idx_store_daily_reports_store_date` (`store_id`, `report_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `store_audit_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `store_id` VARCHAR(255) NOT NULL,
    `store_name` VARCHAR(255) NOT NULL,
    `actor_id` VARCHAR(255) NULL,
    `actor_email` VARCHAR(255) NULL,
    `actor_role` VARCHAR(50) NOT NULL,
    `action_type` VARCHAR(50) NOT NULL,
    `reason` TEXT NULL,
    `created_at` DATETIME(6) NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_store_audit_store` (`store_id`),
    INDEX `idx_store_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_deletion_audits` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `target_reference` VARCHAR(255) NOT NULL,
    `actor_id` VARCHAR(255) NULL,
    `actor_email` VARCHAR(255) NULL,
    `reason` VARCHAR(1000) NOT NULL,
    `deleted_store_count` INT NOT NULL,
    `created_at` DATETIME(6) NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_user_deletion_target` UNIQUE (`target_reference`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `verification_token` (
    `id` VARCHAR(255) NOT NULL,
    `token` VARCHAR(255) NULL,
    `user_id` VARCHAR(255) NOT NULL,
    `expiry_date` DATETIME(6) NULL,
    `created_at` DATETIME(6) NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_verification_token_user` UNIQUE (`user_id`),
    CONSTRAINT `fk_verification_token_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
    INDEX `idx_verification_token_cleanup` (`expiry_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `password_reset_otp` (
    `id` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `otp` VARCHAR(64) NOT NULL,
    `expiry_date` DATETIME(6) NOT NULL,
    `is_used` BIT NOT NULL DEFAULT 0,
    `failed_attempts` INT NOT NULL DEFAULT 0,
    `created_at` DATETIME(6) NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_password_reset_otp_email_created_at` (`email`, `created_at`),
    INDEX `idx_password_reset_otp_cleanup` (`expiry_date`, `is_used`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `invalidated_token` (
    `id` VARCHAR(255) NOT NULL,
    `expiry_time` DATETIME(6) NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_invalidated_token_expiry` (`expiry_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `media_cleanup_tasks` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `public_id` VARCHAR(500) NOT NULL,
    `attempts` INT NOT NULL DEFAULT 0,
    `status` ENUM('DEAD','PENDING') NOT NULL DEFAULT 'PENDING',
    `last_error` VARCHAR(1000) NULL,
    `created_at` DATETIME(6) NULL,
    `last_attempt_at` DATETIME(6) NULL,
    `next_attempt_at` DATETIME(6) NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_media_cleanup_public_id` UNIQUE (`public_id`),
    INDEX `idx_media_cleanup_due` (`status`, `next_attempt_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
