#!/usr/bin/env bash
set -euo pipefail

# Boots Ghost from a source checkout (TryGhost/Ghost) for the e2e suite and
# waits until the Admin API answers on http://localhost:${GHOST_PORT}.
#
#   GHOST_CORE_PATH  path to a Ghost checkout or its ghost/core directory
#                    (default: ./Ghost - the knex-migrator convention)
#   GHOST_LOG_FILE   Ghost boot/output log (default: ./ghost-boot.log)
#   GHOST_PORT       port to serve on (default: 2368)
#
# Dependencies must already be installed in the checkout:
#   pnpm install --frozen-lockfile --filter ghost...
#
# The database is redirected to a throwaway sqlite file next to the log so
# every run starts from a fresh install (the e2e suite requires one), a
# local checkout's development database is never touched, and a caller that
# owns the log directory (e.g. test-e2e/run.sh) can clean everything up.
# The Ghost process keeps running in the background; the PID is written to
# ghost.pid next to the log file.

GHOST_CORE_PATH="${GHOST_CORE_PATH:-./Ghost}"
GHOST_LOG_FILE="${GHOST_LOG_FILE:-./ghost-boot.log}"
GHOST_PORT="${GHOST_PORT:-2368}"

if [ -f "${GHOST_CORE_PATH}/ghost/core/index.js" ]; then
    core_dir="${GHOST_CORE_PATH}/ghost/core"
elif [ -f "${GHOST_CORE_PATH}/index.js" ]; then
    core_dir="${GHOST_CORE_PATH}"
else
    echo "GHOST_CORE_PATH ('${GHOST_CORE_PATH}') is not a Ghost checkout - expected ghost/core/index.js" >&2
    exit 1
fi

log_file="$(cd "$(dirname "${GHOST_LOG_FILE}")" && pwd)/$(basename "${GHOST_LOG_FILE}")"
pid_file="$(dirname "${log_file}")/ghost.pid"
db_file="$(dirname "${log_file}")/ghost-e2e.db"

echo "Booting Ghost from ${core_dir}"
echo "  log: ${log_file}"
echo "  db:  ${db_file}"

(
    cd "${core_dir}"
    # same boot command as ghost/core's own dev tooling (see nodemon.json);
    # env overrides force a fresh sqlite db and the url the specs expect
    NODE_ENV=development \
    url="http://localhost:${GHOST_PORT}" \
    server__port="${GHOST_PORT}" \
    database__client="better-sqlite3" \
    database__connection__filename="${db_file}" \
        nohup node --conditions=source --import=tsx index.js > "${log_file}" 2>&1 &
    echo $! > "${pid_file}"
)

echo "Ghost started with PID $(cat "${pid_file}") - stop it with: kill \$(cat ${pid_file})"

# on failure or interrupt, don't leave an orphaned Ghost or temp db behind -
# deliberately NOT on EXIT: a successful start must leave Ghost running for
# the bootstrap and test steps that follow
cleanup() {
    if [ -f "${pid_file}" ]; then
        kill "$(cat "${pid_file}")" 2>/dev/null || true
        rm -f "${pid_file}"
    fi
    # keep the log around for inspection, only remove the throwaway db
    rm -f "${db_file}"
}
trap cleanup INT TERM

for _ in $(seq 1 90); do
    if curl -sf -o /dev/null "http://localhost:${GHOST_PORT}/ghost/api/admin/site/"; then
        echo "Ghost is ready"
        exit 0
    fi
    sleep 2
done

echo "Ghost did not become ready within 180s" >&2
tail -50 "${log_file}" >&2
cleanup
exit 1
