-- Owner-facing store history support.
-- Snapshot fields deliberately have no foreign keys so moderation history survives
-- store deletion. User hard-delete anonymizes owner_id_snapshot in application code.

ALTER TABLE `store_audit_logs`
    ADD COLUMN `owner_id_snapshot` VARCHAR(255) NULL AFTER `store_name`,
    ADD COLUMN `status_before` VARCHAR(50) NULL AFTER `reason`,
    ADD COLUMN `status_after` VARCHAR(50) NULL AFTER `status_before`,
    ADD COLUMN `owner_visible` BIT NOT NULL DEFAULT 0 AFTER `status_after`;

UPDATE `store_audit_logs` log
JOIN `stores` store_record ON store_record.`id` = log.`store_id`
SET log.`owner_id_snapshot` = store_record.`owner_id`
WHERE log.`owner_id_snapshot` IS NULL;

UPDATE `store_audit_logs`
SET `owner_id_snapshot` = `actor_id`
WHERE `owner_id_snapshot` IS NULL
  AND `actor_role` = 'OWNER'
  AND `actor_id` IS NOT NULL;

UPDATE `store_audit_logs`
SET `owner_visible` = 1
WHERE `action_type` IN (
    'SUBMIT', 'APPROVE', 'REJECT', 'EDIT_PENDING', 'RESUBMIT_AFTER_EDIT',
    'EDIT_HIDDEN', 'HIDE', 'RECOVER', 'REQUEST_RECOVERY',
    'REJECT_RECOVERY_REQUEST', 'HARD_DELETE'
);

CREATE INDEX `idx_store_audit_owner_created`
    ON `store_audit_logs` (`owner_id_snapshot`, `created_at`, `id`);

CREATE INDEX `idx_store_audit_store_created`
    ON `store_audit_logs` (`store_id`, `created_at`, `id`);
