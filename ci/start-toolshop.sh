#!/usr/bin/env bash
# Starts the Toolshop from ci/toolshop.compose.yml, seeds the database and waits until
# the UI and the API answer. Used by the CI workflow; works the same on a dev machine.
set -euo pipefail
compose="docker compose -f $(dirname "$0")/toolshop.compose.yml"

$compose up -d --quiet-pull

# MariaDB needs a few seconds before it accepts connections.
for i in $(seq 1 30); do
  if $compose exec -T laravel-api php artisan migrate:fresh --seed --force > /dev/null 2>&1; then
    echo "Database seeded"; break
  fi
  [ "$i" = 30 ] && { echo "Database seeding failed"; $compose logs; exit 1; }
  sleep 5
done

wait_for() {
  for i in $(seq 1 60); do
    curl -sf -o /dev/null "$1" && { echo "$1 is up"; return 0; }
    sleep 5
  done
  echo "$1 did not start"; $compose logs; exit 1
}
wait_for http://localhost:8091/status
wait_for http://localhost:4200/
