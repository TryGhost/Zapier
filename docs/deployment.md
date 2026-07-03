# Deployment

How the Ghost integration is versioned, released, and rolled out on Zapier's
platform. Deploys are manual and human-owned — nothing in CI pushes to Zapier.

## Prerequisites

- The `zapier-platform` CLI, installed globally:
  `npm install --global zapier-platform-cli` (the binary is called
  `zapier-platform` since v19)
- Authentication against Zapier's platform with a deploy key:
  `zapier-platform login`
- The integration is Zapier app `1566` (`App1566`), pinned in `.zapierapprc`

## Versioning rules

- The integration version lives in `package.json` and is bumped by hand as
  part of a release — never by automation.
- **Stay within the current major.** Since 2026-02-26 Zapier blocks migrating
  users across integration major versions, so a version pushed under a new
  major can never receive existing users. Users on old majors stay pinned to
  the integration versions their Zaps were created with.

## Releasing a private version (invite-only testing)

1. Bump the version in `package.json` (do not commit)
2. `zapier-platform push`

To test the private version in a close-to-live environment, migrate a single
user account's Zaps to it:

```sh
zapier-platform migrate 2.4.0 2.4.1 --user=user@example.com
zapier-platform history   # check the migration completed
```

## Releasing a public version

1. Bump the version in `package.json`
2. Update `CHANGELOG.md`
3. Commit both changes with a message matching the new version, e.g.
   `git commit -m "2.4.0"`
4. Tag the commit: `git tag 2.4.0`
5. Push the commit and tag upstream: `git push upstream main --tags`
6. `zapier-platform push`
7. `zapier-platform promote 2.4.0` — from here on, new connections use this
   version; existing users stay where they are until migrated

## Migrating existing users to a new version

1. `zapier-platform migrate {oldVersion} {newVersion} {percentage}`, e.g.
   `zapier-platform migrate 2.3.1 2.4.0 10` moves 10% of users. Roll out
   gradually and watch Zapier's error dashboard before migrating 100%.
   Remember that cross-major migrations are blocked (see
   [Versioning rules](#versioning-rules)).
2. `zapier-platform history` — check migration status and continue once the
   step reports 100% complete.

Zapier's own reference:
[deploying an integration version](https://docs.zapier.com/integrations/reference/cli-docs#deploying-an-integration-version).

## Testing a private version against a local Ghost

To check changes against a production-like setup before promoting:

1. Release a private version and migrate your own account to it (see above).
2. Expose your local Ghost instance so Zapier can reach it — we use
   [Tailscale Funnel](https://tailscale.com/kb/1223/funnel):
   `tailscale funnel 2368`. (Any tunnel that gives you a public HTTPS URL
   works, e.g. `ngrok http http://localhost:2368`.)
3. In your regular Zapier account, create a new Zap and select the Ghost
   private version under test.
4. Connect it to your local instance via the public URL the tunnel printed.
5. Use your local Ghost as usual — webhook deliveries and API requests from
   Zapier now hit it. If nothing comes through, check Zapier's error
   dashboard.
