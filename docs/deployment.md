# Deployment

How the Ghost integration is versioned, released, and rolled out on Zapier's
platform. Deploys run through two GitHub Actions workflows — humans decide
*when* by creating a GitHub release, and humans own the staged user
migration afterwards. Nobody runs `zapier-platform push` or `promote` by
hand anymore (a manual runbook survives [as a fallback](#fallback-manual-cli-runbook)).

The integration is Zapier app `1566` (`App1566`), pinned in `.zapierapprc`.

## Previews: green Test runs on main

[`preview.yml`](../.github/workflows/preview.yml) pushes a private build to
Zapier after every green Test run on main, at the fixed snapshot version
**`0.0.0-preview`**. Zapier never allows promoting labeled versions and only
promoted versions become immutable, so this version can never collide with a
release and is simply replaced on every push. In practice that is every
human merge to main; the one exception is the publish workflow's own
bookkeeping commit, which is pushed by the Actions bot and therefore
triggers no Test run and no preview (its content shipped as the release
anyway).

To try the current main: open the Zap editor with the developer account and
pick version `0.0.0-preview` of the Ghost integration. To test against a
local Ghost, see [below](#testing-a-private-version-against-a-local-ghost).

## Releasing: publish a GitHub release

1. Make sure `CHANGELOG.md` has the release notes under the running
   `## Unreleased` heading — the release fails (on purpose) without them.
2. [Create a GitHub release](https://github.com/TryGhost/Zapier/releases/new)
   for a new tag `vX.Y.Z` on main (e.g. `v3.0.0`). The tag names the
   integration version; nothing is bumped by hand. Don't mark it as a
   pre-release — Zapier cannot promote labeled versions, so pre-releases are
   rejected.
3. [`publish.yml`](../.github/workflows/publish.yml) takes over:
   - **guards**: the tag parses as a promotable `x.y.z` version, points at a
     commit on main, and that commit has a green "Required checks pass" run;
   - **finalize**: renames the `## Unreleased` heading in `CHANGELOG.md` to
     `## X.Y.Z` (`scripts/release-changelog.js`) and sets the version in
     `package.json`;
   - **push + promote**: uploads the build and promotes it. `promote` reads
     the `## X.Y.Z` section of `CHANGELOG.md` as the user-facing changelog.
     From here on, new connections use the released version; existing users
     stay where they are;
   - **bookkeeping**: opens a `release/vX.Y.Z` PR with the finalized
     `CHANGELOG.md` and `package.json`, dispatches Test onto it, and enables
     auto-merge, so main records the release without anyone pushing to it
     directly.
4. **Migrate existing users — the only manual step.** Roll out gradually and
   watch [Zapier's error dashboard](https://developer.zapier.com/) between
   steps:

   ```sh
   zapier-platform migrate 2.6.3 3.0.0 10   # then 50, then 100
   zapier-platform history                  # check the step completed
   ```

   Cross-major migrations are blocked (see
   [Versioning rules](#versioning-rules)).

Zapier's own reference:
[deploying an integration version](https://docs.zapier.com/integrations/reference/cli-docs#deploying-an-integration-version).

## Versioning rules

- The released version is defined by the release tag; the publish workflow
  writes it into `package.json`. Never bump the version by hand.
- `CHANGELOG.md` collects unreleased work under a literal `## Unreleased`
  heading (suffixes like "(next major)" are fine). The publish workflow
  turns it into the release heading.
- **Stay within the current major.** Since 2026-02-26 Zapier blocks
  migrating users across integration major versions, so a version pushed
  under a new major can never receive existing users. Users on old majors
  stay pinned to the integration versions their Zaps were created with.

## First-run checklist

One-time setup before the workflows can deploy, plus a supervised first
release:

1. **Create a deploy key**: sign in to the
   [Zapier developer platform](https://developer.zapier.com/) with the
   integration's owner account and generate a deploy key for app 1566
   (the same credential `zapier-platform login` provisions).
2. **Create the `zapier` GitHub environment** (repo Settings → Environments)
   and add the key as the `ZAPIER_DEPLOY_KEY` environment secret. Both
   workflows request this environment; until it exists with the secret,
   their runs fail at the push step and touch nothing.
3. **Decide on environment protection.** Required reviewers on the `zapier`
   environment would gate every deploy — but the preview job deploys on
   *every* merge to main, so each merge would sit waiting for approval.
   Leave the environment unprotected for hands-off previews, or accept the
   click-per-merge if deploys should need a human.
4. **Watch a preview run**: merge any PR (or re-run the last Test run on
   main) and confirm the Preview workflow pushes `0.0.0-preview`, then that
   the version shows up in the Zap editor.
5. **Supervise the first release**: create the next release (per above) and
   watch the publish run end-to-end — the `versions --format json` state
   check, the promote, and the bookkeeping PR auto-merging — before trusting
   it unattended.

## Failure modes and recovery

The publish workflow is ordered so a failure never needs an undo: guards and
changelog finalizing run before anything mutates, Zapier goes live before
the repo bookkeeping, and every step is idempotent or self-skipping. **The
universal recovery is: fix the cause, then re-run the failed run from the
Actions UI** (or re-publish the release). Specifically:

- **A guard fails** (bad tag, tag not on main, Test not green, missing
  release notes): nothing happened — neither Zapier nor the repo changed.
  Fix and re-run. If the tag itself was wrong, delete the release and tag
  and start over; nothing referenced them yet.
- **Push or promote fails**: the repo is untouched; a non-promoted upload
  may exist on Zapier but is harmless — the next attempt overwrites it
  (only *promoted* versions are immutable). Re-run.
- **Promote succeeded, bookkeeping PR failed**: the release is live and
  correct; only main's `CHANGELOG.md`/`package.json` lag. Re-running skips
  push/promote (the version already reports state `promoted`) and redoes
  the PR. Equally fine: open the same two-file PR by hand.
- **The bookkeeping PR hangs unmerged**: auto-merge waits for "Required
  checks pass"; the workflow dispatches Test onto the branch to provide it.
  If another commit lands on main first, the branch needs updating before
  the strict check lets it merge — update the branch in the PR UI (this
  re-arms auto-merge) or rebase-merge it manually once green.
- **Preview push fails**: previews are stateless — the next merge to main
  (or a re-run) replaces `0.0.0-preview` wholesale. If Zapier ever refuses
  to overwrite it (it became immutable by gathering more than 5 Zap users —
  it should only ever have the developer account), delete it with
  `zapier-platform delete:version 0.0.0-preview` after migrating those Zaps
  off, or switch the snapshot label in `preview.yml`.
- **The next release tags the bookkeeping commit**: the auto-merged
  bookkeeping commit is pushed by the Actions bot, so it carries no Test
  run — tagging exactly that commit makes the green-check guard fail with
  "missing". Run `gh workflow run test.yml --ref main`, wait for green,
  then re-run the publish run (or tag a later commit).

Two smaller caveats, no action needed:

- **Preview ordering race**: a cancelled preview run's upload can in
  principle still land around the same time as its successor's, so
  `0.0.0-preview` may briefly not match the newest main commit. The next
  green merge (or a manual re-run) replaces it wholesale.
- **One release at a time**: the publish concurrency group keeps at most
  one run pending — publishing several releases in quick succession
  cancels the middle ones. Cancelled that way, a release simply needs its
  run re-run from the Actions UI; nothing has half-happened.

## Testing a private version against a local Ghost

To check changes against a production-like setup before promoting:

1. In your regular Zapier account, create a new Zap and select the Ghost
   version under test (`0.0.0-preview`, or migrate a single user account's
   Zaps to it: `zapier-platform migrate 2.6.3 2.6.4 --user=user@example.com`).
2. Expose your local Ghost instance so Zapier can reach it — we use
   [Tailscale Funnel](https://tailscale.com/kb/1223/funnel):
   `tailscale funnel 2368`. (Any tunnel that gives you a public HTTPS URL
   works, e.g. `ngrok http http://localhost:2368`.)
3. Connect the Zap to your local instance via the public URL the tunnel
   printed.
4. Use your local Ghost as usual — webhook deliveries and API requests from
   Zapier now hit it. If nothing comes through, check Zapier's error
   dashboard.

## Maintenance releases for the previous major

Existing Zaps stay pinned to the integration version they were created on,
and Zapier blocks migrating users across the integration's own majors — so
users of the previous major can only receive fixes through same-major
releases (e.g. `2.6.4`).

The [`2.x` branch](https://github.com/TryGhost/Zapier/tree/2.x) exists for
exactly that: it is the last Ghost-≥2.19-compatible state (before the
Ghost 6 floor) on the modern toolchain, with working CI. To ship a fix for
old-major users: branch off `2.x`, open a PR targeting `2.x`, then push,
promote, and migrate by hand — the automated workflows only release main
(the publish workflow rejects tags that aren't on main), so 2.x releases
follow the [fallback runbook](#fallback-manual-cli-runbook).

## Fallback: manual CLI runbook

For 2.x maintenance releases, or if the workflows are unavailable. You need
the CLI (`npm install --global zapier-platform-cli` — the binary is called
`zapier-platform` since v19) and `zapier-platform login`.

1. Set the version in `package.json` and finalize `CHANGELOG.md` (for a
   main release: `node scripts/release-changelog.js finalize X.Y.Z`) — the
   `## X.Y.Z` changelog section is what `promote` ships as the user-facing
   changelog
2. Land those changes through a PR, tag the released commit `vX.Y.Z`, and
   push the tag
3. `zapier-platform push`
4. `zapier-platform promote X.Y.Z`
5. Migrate users gradually (see the release flow above)

A push alone (without promote) releases a private version for invite-only
testing — that is all the preview workflow does, with a snapshot label
instead of a version bump.
