#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: restore-mysql.sh /absolute/path/to/backup.sql.gz" >&2
  exit 2
fi

backup_file="$1"
: "${MYSQL_HOST:?MYSQL_HOST is required}"
: "${MYSQL_PORT:=3306}"
: "${MYSQL_DATABASE:?MYSQL_DATABASE is required}"
: "${MYSQL_USER:?MYSQL_USER is required}"
: "${MYSQL_PASSWORD:?MYSQL_PASSWORD is required}"
: "${CONFIRM_RESTORE:?Set CONFIRM_RESTORE to the exact target database name}"

if [[ "$CONFIRM_RESTORE" != "$MYSQL_DATABASE" ]]; then
  echo "CONFIRM_RESTORE does not match MYSQL_DATABASE" >&2
  exit 2
fi
if [[ ! -f "$backup_file" || "$backup_file" != /* ]]; then
  echo "Backup must be an existing absolute path" >&2
  exit 2
fi
if [[ -f "$backup_file.sha256" ]]; then
  sha256sum --check "$backup_file.sha256"
fi

export MYSQL_PWD="$MYSQL_PASSWORD"
gzip --decompress --stdout "$backup_file" | mysql \
  --host="$MYSQL_HOST" \
  --port="$MYSQL_PORT" \
  --user="$MYSQL_USER" \
  --default-character-set=utf8mb4 \
  "$MYSQL_DATABASE"
unset MYSQL_PWD

echo "Restore completed into explicitly confirmed database: $MYSQL_DATABASE"
