#!/usr/bin/env bash
set -euo pipefail
umask 077

: "${MYSQL_HOST:?MYSQL_HOST is required}"
: "${MYSQL_PORT:=3306}"
: "${MYSQL_DATABASE:?MYSQL_DATABASE is required}"
: "${MYSQL_USER:?MYSQL_USER is required}"
: "${MYSQL_PASSWORD:?MYSQL_PASSWORD is required}"
: "${BACKUP_DIR:?BACKUP_DIR must be an absolute dedicated backup directory}"

case "$BACKUP_DIR" in
  /*) ;;
  *) echo "BACKUP_DIR must be absolute" >&2; exit 2 ;;
esac
if [[ "$BACKUP_DIR" == "/" ]]; then
  echo "Refusing to use filesystem root as BACKUP_DIR" >&2
  exit 2
fi

mkdir -p -- "$BACKUP_DIR"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
output="$BACKUP_DIR/${MYSQL_DATABASE}_${timestamp}.sql.gz"

export MYSQL_PWD="$MYSQL_PASSWORD"
mysqldump \
  --host="$MYSQL_HOST" \
  --port="$MYSQL_PORT" \
  --user="$MYSQL_USER" \
  --single-transaction \
  --routines \
  --triggers \
  --set-gtid-purged=OFF \
  --default-character-set=utf8mb4 \
  "$MYSQL_DATABASE" | gzip -9 > "$output"
unset MYSQL_PWD

test -s "$output"
sha256sum "$output" > "$output.sha256"
echo "Backup created: $output"
