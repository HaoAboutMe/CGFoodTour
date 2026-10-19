# Deployment and rollback runbook

## Preconditions

- DNS and TLS certificate are valid.
- Production secrets are present in the secret store and pass the fail-fast validator.
- MySQL is reachable over a private network and TLS is enabled.
- A fresh off-host backup exists and its checksum was recorded.
- The target image tags/digests and previous working digests are recorded.
- Only one backend replica is configured.

## Deploy order

1. Build backend/frontend images from a clean commit and run automated tests.
2. Record image digests and release commit.
3. Put the application into maintenance/read-only mode if the migration is not backward-compatible.
4. Execute Flyway once using the new backend artifact against a restored rehearsal database first.
5. Execute the reviewed migration job against the target database.
6. Start the backend and wait for `/api/actuator/health/readiness` to return `UP`.
7. Start/update the frontend and Nginx.
8. Run API, deep-link, cookie, OAuth and upload smoke tests.
9. Watch readiness, HTTP 5xx, latency, Hikari pool, email failures and disk for at least 15 minutes.
10. Record the release outcome and remove maintenance mode.

Do not set `baselineOnMigrate=true` during routine deploy. An existing database
may only be baselined after schema comparison on a restored copy and explicit review.

## Application rollback

Use the previous immutable image digest when the schema remains backward-compatible:

1. Stop routing traffic to the new process.
2. Start the previous backend image.
3. Confirm readiness and run protected/public smoke tests.
4. Restore the previous frontend image when its contract also changed.
5. Record correlation IDs and error evidence before logs rotate.

## Database failure after migration

- Prefer a reviewed forward-fix migration.
- Do not run ad-hoc destructive SQL or automatic down migration.
- Do not restore production merely to undo a code error: restore discards writes after the backup.
- If restore is unavoidable, enter maintenance mode, record the recovery point, obtain explicit approval and follow `BACKUP_RESTORE_RUNBOOK.md`.

## Go/no-go

Abort or roll back when readiness remains down, migration validation fails,
critical auth/upload flows fail, 5xx increases materially, or database connections
remain exhausted. Email/provider degradation may use a documented limited mode only
when registration/reset semantics stay truthful and an alert is active.
