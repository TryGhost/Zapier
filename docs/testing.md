# Testing

Use the local commands first, then use a private Zapier version when the
change needs the real Zap editor or Zapier-hosted webhooks.

## Local checks

```sh
pnpm lint
pnpm test
pnpm test:e2e
```

`pnpm test` runs the Vitest unit suite with 100% coverage thresholds. Do not
lower those thresholds to land a change; add the missing test instead.

`pnpm test:e2e` runs the Zapier app against a real Ghost. With Docker running,
it boots a fresh `ghost:6` container, creates the owner user, creates a custom
integration, writes the Admin API credentials to `test-e2e/.env.local`, runs
the ordered e2e files, and tears the container down.

The e2e files share state. They run one file at a time in filename order, and
`02-creates.test.js` seeds fixtures the later trigger and search tests assert
on. Do not parallelize the e2e config or renumber those files.

## Testing against Ghost source

To test against a Ghost checkout instead of the Docker image:

```sh
cd /path/to/Ghost
pnpm install --frozen-lockfile --filter ghost...

cd /path/to/Zapier
GHOST_CORE_PATH=/path/to/Ghost pnpm test:e2e
```

The runner starts Ghost from that checkout, bootstraps it through HTTP, runs
the e2e suite, and stops the process on exit.

## Testing against a Ghost you started yourself

Use a fresh Ghost. The e2e fixtures use fixed emails, titles, slugs, and other
values, so a reused seeded site will usually fail for the right reason.

```sh
GHOST_URL=http://localhost:2368 node test-e2e/setup/bootstrap.js
pnpm test:e2e
```

`GHOST_URL` defaults to `http://localhost:2368`. The bootstrap script only
supports local `http://` URLs because it uses Node's `http` module directly.

If `GHOST_ADMIN_API_URL` and `GHOST_ADMIN_API_KEY` are already exported,
`pnpm test:e2e` skips provisioning and runs the bare Vitest e2e suite.

## Testing a private Zapier version against local Ghost

Use this when you need to see Zapier-hosted behavior in the real Zap editor.
The normal candidate is `0.0.0-preview`, which GitHub Actions refreshes after
every green Test run on main. Release candidates can also be tested after a
private push, before promotion.

1. Start Ghost locally.
2. Expose it through a public HTTPS tunnel:

   ```sh
   tailscale funnel 2368
   # or:
   ngrok http http://localhost:2368
   ```

3. In a regular Zapier account, create a new Zap and choose the Ghost version
   under test. If you need the integration owner account, use the
   `info+zapier@ghost.org` credentials from 1Password.
4. Connect the Zap to the tunnel URL.
5. Use local Ghost normally. Trigger events and Admin API calls from Zapier
   should now arrive at your local process.

If nothing arrives, check the Zap run history and the
[Zapier developer dashboard for app 1566](https://developer.zapier.com/app/1566)
first, then check the local Ghost logs. Most failures at this layer are URL,
auth, webhook delivery, or sample-shape problems rather than unit test
problems.

Do not run `zapier-platform push`, `promote`, or `migrate` by hand for normal
main releases. The deploy path is in [deployment.md](deployment.md); staged
user migration is the only manual release step.

## Zapier validation checks

Zapier's validation checks are worth running before a larger user-facing
change, especially when changing input fields, samples, output fields, REST
hook triggers, or connection labels. The checks look for compatibility and
definition problems such as removed public surfaces, sample data drift,
missing polling URLs for REST hooks, unsafe auth labels, and bad help text.

Run them through the CLI when you are logged in with the Zapier owner account
from 1Password (`info+zapier@ghost.org`):

```sh
pnpm exec zapier-platform validate
```

Warnings are not always blockers for private versions, but do read them. A
warning about samples, polling data, or field compatibility is usually a real
Zap editor or migration problem waiting to happen.
