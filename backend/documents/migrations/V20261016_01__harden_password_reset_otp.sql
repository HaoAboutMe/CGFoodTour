-- Required before deploying the hardened OTP model to an existing MySQL database.
-- Keep this change additive/reversible until the OTP flow has been verified.

ALTER TABLE password_reset_otp
    MODIFY COLUMN otp VARCHAR(64) NOT NULL,
    ADD COLUMN failed_attempts INT NOT NULL DEFAULT 0;

-- Existing plaintext challenges must not remain usable after cutover.
UPDATE password_reset_otp
SET is_used = TRUE
WHERE is_used = FALSE;

CREATE INDEX idx_password_reset_otp_email_created_at
    ON password_reset_otp (email, created_at);
