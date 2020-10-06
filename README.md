# Ghost-Zapier

## Node version support

All Zapier CLI apps are run using Node.js v10.16.0. More details are available in the [requirements doc](https://zapier.github.io/zapier-platform-cli/index.html#requirements).

Notes:
- there is a `.nvmrc` file in this project if you have `nvm` auto-switching enabled

## Ghost version support

Zapier checks the version of Ghost when authenticating to ensure that the API supports the required webhooks endpoints and other features. This is done by fetching the `/ghost/api/v2/admin/site/` endpoint.

When a new major version of Ghost is released the [supported version string](https://github.com/TryGhost/Ghost-Zapier/blob/4739696c1dde5a197ea89531536deebfab8f57ab/app/authentication.js#L4) must be updated!

## Local Testing

- `zapier test` will run the tests, you _have_ to be running node 6.10.2
- `zapier test --debug` will test and output request and response logs

## Deploying

*Note:* This is a non-migratable ALPHA version of a rewrite, do _not_ follow the normal release process!

1. bump the version in `package.json`, update `CHANGELOG.md`, and commit
2. `zapier push`
3. <strike>`zapier promote {newVersion}` - new intregrations will use this version</strike>
4. <strike>`zapier migrate {oldVersion} {newVersion}`, eg: `zapier migrate 1.0.4 0.0.5`, existing integrations will be moved to the new version</strike>
5. <strike>`zapier history` to check migration status, continue once 100% complete</strike>
