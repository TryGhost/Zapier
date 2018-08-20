# Ghost-Zapier

## Node version support

All Zapier CLI apps are run using Node.js v6.10.2. More details are available in the [requirements doc](https://zapier.github.io/zapier-platform-cli/index.html#requirements).

Notes:
- there is a `.nvmrc` file in this project if you have `nvm` auto-switching enabled

## Ghost version support

Zapier checks the version of Ghost when authenticating to ensure that the API supports the required webhooks endpoints and other features. This is done by fetching the `/ghost/api/v0.1/configuration/about/` endpoint.

When a new major version of Ghost is released the [supported version string](https://github.com/TryGhost/Ghost-Zapier/blob/master/authentication.js#L3) must be updated!

## Local Testing

- `zapier test` will run the tests, you _have_ to be running node 6.10.2
- `zapier test --debug` will test and output request and response logs

## Deploying

*Note:* These instructions will need updating once our app is public because we'll want to test the private version before promoting it to public.

1. bump the version in `package.json` and commit
2. `zapier push`
3. `zapier promote {newVersion}` - new intregrations will use this version
4. `zapier migrate {oldVersion} {newVersion}`, eg: `zapier migrate 1.0.4 0.0.5`, existing integrations will be moved to the new version
5. `zapier history` to check migration status, continue once 100% complete
6. `zapier delete version {oldVersion}`, eg: `zapier delete version 1.0.4`
