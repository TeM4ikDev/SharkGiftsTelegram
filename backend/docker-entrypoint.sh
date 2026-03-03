#!/bin/sh
set -e
mkdir -p /app/data
chown -R node:node /app/data 2>/dev/null || true
exec su-exec node "$@"
