# CG FoodTour operations

This directory contains deployment and recovery runbooks. It intentionally does
not contain real credentials. Start with `rehearsal.env.example` at repository
root and store the real environment file outside Git.

## Local migration rehearsal

```bash
cp rehearsal.env.example rehearsal.env
# Replace every CHANGE_ME value.
docker compose --env-file rehearsal.env -f compose.rehearsal.yml up --build
curl --fail http://127.0.0.1:8081/api/actuator/health/readiness
```

Mailpit is available only on loopback at `http://127.0.0.1:8025`. The rehearsal
profile does not represent secure-cookie/OAuth behavior; those require HTTPS
staging as described in the deployment runbook.

## Runbooks

- `DEPLOYMENT_RUNBOOK.md`: immutable deploy, Flyway, health verification and rollback.
- `BACKUP_RESTORE_RUNBOOK.md`: off-host database backup and restore rehearsal.
- `INCIDENT_RUNBOOK.md`: initial response for backend, database, SMTP, OAuth and Cloudinary incidents.

The scripts are helpers, not a replacement for reviewing the exact target host,
database and backup location before execution.
