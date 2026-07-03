# AGENTS.md

Ghost's official Zapier integration — a Zapier Platform CLI app
(`zapier-platform-core` 19, Node 22, CommonJS). See [README.md](README.md)
for what it does and [docs/deployment.md](docs/deployment.md) for the release
runbook.

## Commands

```sh
pnpm install
pnpm lint       # oxlint + oxfmt --check
pnpm lint:fix
pnpm test       # vitest unit tests, coverage gated at 100%
pnpm test:e2e   # self-contained: boots a throwaway ghost:6 docker container
```

`pnpm test:e2e` provisions, bootstraps, and tears down its own Ghost when
Docker is available. Overrides: `GHOST_CORE_PATH=/path/to/Ghost` boots Ghost
from a source checkout instead; or point it at a fresh Ghost you run yourself
via `node test-e2e/setup/bootstrap.js` (set `GHOST_URL` if it is not on
`http://localhost:2368`).

## Boundaries

- **Never run `zapier-platform push`, `promote`, or `migrate`.** Deploying to
  Zapier is human-owned — see [docs/deployment.md](docs/deployment.md).
- **Never bump `version` in package.json.** Versions are owner-managed as
  part of the manual release flow.
- **Never lower the coverage thresholds** in `vitest.config.js` — they are
  100% across the board and gate CI.
- **The Ghost compatibility floor is single-sourced** as `GHOST_MAJOR` in
  `app/lib/utils.js`: the auth-time version check and the `Accept-Version`
  request header must move together. Don't hardcode Ghost versions elsewhere.
- **Keep the Renovate guards in `renovate.json5`.** `zapier-platform-core`
  majors change Zapier's deployed Lambda runtime and need a coordinated
  manual push/promote/migrate, so they must never ride an automated merge;
  the pnpm `<11` and e2e setup-node `<23` rules protect the supported Node
  range. Each rule's `description` explains its reasoning — update it if you
  change the rule.

## Conventions

- 4-space indentation, single quotes — enforced by oxfmt; `pnpm lint` must
  pass before committing.
- vitest APIs are imported explicitly (`import { describe, it, expect } from
  'vitest'`) — globals are not enabled.
- Dependencies are pinned to exact versions; Renovate keeps them current.
- Commit messages explain **why** the change was made, not what changed. No
  `Co-Authored-By` trailers.

## Gotchas

- The e2e specs share state (02-creates seeds fixtures the later specs assert
  on) and run one file at a time in filename order — `vitest.e2e.config.js`
  enforces this. Don't parallelise them or renumber the files.
- The `sample` objects in `app/` triggers/creates/searches mirror real
  Ghost 6 API shapes and are shown to users in the Zap editor — don't trim
  or invent fields.
