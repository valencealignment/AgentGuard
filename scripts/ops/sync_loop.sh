#!/bin/sh
set -eu

INTERVAL="${WAAL_SYNC_INTERVAL_SECONDS:-60}"

while true; do
  git fetch origin || true
  git pull --rebase --autostash || true
  git push || true
  sleep "${INTERVAL}"
done
