#!/usr/bin/env bash
set -euo pipefail

# Self-contained e2e runner - a bare `yarn test:e2e` should just work.
#
# Resolution order:
# 1. GHOST_ADMIN_API_URL/GHOST_ADMIN_API_KEY exported (CI): run mocha
#    directly, no lifecycle management
# 2. test-e2e/.env.local pointing at a Ghost that still answers: reuse it
# 3. GHOST_CORE_PATH set: boot Ghost from that source checkout
# 4. docker available: boot a fresh ghost:6 container in development mode
#    (development so Ghost accepts sqlite - no MySQL service needed)
# 5. otherwise: explain the options
#
# Ghosts provisioned by 3 and 4 are fresh installs - the suite's fixtures
# use fixed emails/titles, so re-running against seeded data would fail -
# and are torn down afterwards whether mocha passes or fails. The script's
# exit code is mocha's exit code.

here="$(cd "$(dirname "$0")" && pwd)"
root="$(cd "${here}/.." && pwd)"
env_file="${here}/.env.local"
container="zapier-e2e-ghost"

cd "${root}"

ghost_answers() {
    curl -sf -o /dev/null "$1/ghost/api/admin/site/"
}

wait_for_ghost() {
    for _ in $(seq 1 90); do
        if ghost_answers "${ghost_url}"; then
            return 0
        fi
        sleep 2
    done
    return 1
}

# prefer Ghost's usual port but fall back to an ephemeral one so the runner
# also works next to a developer's own Ghost already sitting on 2368
pick_free_port() {
    node -e "
        const net = require('net');
        const server = net.createServer();
        server.once('error', () => {
            const fallback = net.createServer();
            fallback.listen(0, () => {
                console.log(fallback.address().port);
                fallback.close();
            });
        });
        server.listen(2368, () => {
            server.close(() => console.log(2368));
        });
    "
}

# 1. explicit credentials (CI exports these via $GITHUB_ENV)
if [ -n "${GHOST_ADMIN_API_URL:-}" ] && [ -n "${GHOST_ADMIN_API_KEY:-}" ]; then
    exec yarn test:e2e:bare
fi

# 2. credentials from a previous bootstrap - reuse them if that Ghost is
# still up, otherwise treat the file as stale and provision from scratch
if [ -f "${env_file}" ]; then
    url="$(sed -n 's/^GHOST_ADMIN_API_URL=//p' "${env_file}")"
    if [ -n "${url}" ] && ghost_answers "${url}"; then
        echo "Reusing the Ghost at ${url} (from test-e2e/.env.local)"
        exec yarn test:e2e:bare
    fi
    echo "test-e2e/.env.local points at a Ghost that no longer answers - re-provisioning"
    rm -f "${env_file}"
fi

# 3./4. self-provision a fresh Ghost and tear it down afterwards
provisioned=""
state_dir=""

# shellcheck disable=SC2329 # invoked via the trap below
teardown() {
    if [ "${provisioned}" = "source" ] && [ -f "${state_dir}/ghost.pid" ]; then
        kill "$(cat "${state_dir}/ghost.pid")" 2>/dev/null || true
    fi
    if [ "${provisioned}" = "docker" ]; then
        docker rm -f "${container}" >/dev/null 2>&1 || true
    fi
    if [ -n "${state_dir}" ]; then
        rm -rf "${state_dir}"
    fi
    rm -f "${env_file}"
}
trap teardown EXIT INT TERM

port="$(pick_free_port)"
ghost_url="http://localhost:${port}"

if [ -n "${GHOST_CORE_PATH:-}" ]; then
    provisioned="source"
    state_dir="$(mktemp -d)"
    GHOST_PORT="${port}" GHOST_LOG_FILE="${state_dir}/ghost-boot.log" "${here}/setup/start-ghost.sh"
elif command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    provisioned="docker"
    echo "Booting a fresh ghost:6 container ('${container}') on ${ghost_url}"
    docker rm -f "${container}" >/dev/null 2>&1 || true
    docker run -d --name "${container}" -p "${port}:2368" \
        -e NODE_ENV=development \
        -e url="${ghost_url}" \
        -e database__client=sqlite3 \
        -e database__connection__filename=/var/lib/ghost/content/data/ghost-e2e.db \
        -e database__useNullAsDefault=true \
        ghost:6 >/dev/null
    if ! wait_for_ghost; then
        echo "Ghost container did not become ready within 180s" >&2
        docker logs "${container}" 2>&1 | tail -50 >&2
        exit 1
    fi
    echo "Ghost is ready"
else
    cat >&2 <<'EOF'
No Ghost to test against and no way to provision one. Pick one:
  - start docker                    -> `yarn test:e2e` boots a throwaway ghost:6 container
  - GHOST_CORE_PATH=/path/to/Ghost  -> boots Ghost from a source checkout
                                       (needs `pnpm install --frozen-lockfile --filter ghost...`)
  - run any fresh Ghost yourself    -> `node test-e2e/setup/bootstrap.js` (set GHOST_URL if it
                                       is not on http://localhost:2368), then `yarn test:e2e`
EOF
    exit 1
fi

GHOST_URL="${ghost_url}" node "${here}/setup/bootstrap.js"

set +e
yarn test:e2e:bare
status=$?
set -e

exit "${status}"
