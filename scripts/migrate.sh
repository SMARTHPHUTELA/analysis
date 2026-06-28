#!/bin/bash
# Usage: ./scripts/migrate.sh 002_add_savings.sql

FILE=$1

if [ -z "$FILE" ]; then
  echo "Usage: ./scripts/migrate.sh <filename.sql>"
  exit 1
fi

echo "Running migration: $FILE"

docker exec -i acp_postgres psql \
  -U ${POSTGRES_USER:-acp_user} \
  -d ${POSTGRES_DB:-acp_db} \
  < scripts/$FILE

echo "Done."