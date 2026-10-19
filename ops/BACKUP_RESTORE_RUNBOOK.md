# Database backup and restore runbook

## Policy

- Create one logical MySQL backup every day.
- Encrypt and copy it to storage outside the application VM.
- Suggested beta retention: 7 daily, 4 weekly and 3 monthly restore points.
- Keep a weekly VM snapshot as a secondary layer, never as the only database backup.
- Alert if no successful backup has completed within 26 hours.

## Backup

Set `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`
and an absolute `BACKUP_DIR`, then run `ops/scripts/backup-mysql.sh` on the server.

The script creates a compressed dump and SHA-256 checksum. Upload both to encrypted
off-host object storage. A successful exit only proves dump creation, not restorability.

## Restore rehearsal

1. Provision an isolated MySQL instance with no production network access.
2. Download one recent dump and checksum.
3. Verify the checksum.
4. Set restore database variables and `CONFIRM_RESTORE` to the exact target database name.
5. Run `ops/scripts/restore-mysql.sh <dump.sql.gz>`.
6. Run Flyway validation/migration with the candidate backend artifact.
7. Start the backend against the restored database.
8. Verify users, approved/non-public stores, food items, ratings, saved counters and media references.
9. Record start/end time, backup timestamp, row-count checks and failures.
10. Destroy only the explicitly named rehearsal environment.

Before the first Flyway baseline of an existing database, run
`ops/sql/schema_inventory.sql` against both the restored database and a clean
Flyway-built database. Review table, column, index and foreign-key differences;
do not baseline merely because the application currently starts.

Run this before public launch, monthly during beta, and after material schema changes.
The measured age of restored data is the observed RPO; total recovery duration is
the observed RTO.
