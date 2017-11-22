# Ghost-Zapier

## Node version support

All Zapier CLI apps are run using Node.js v6.10.2. More details are available in the [requirements doc](https://zapier.github.io/zapier-platform-cli/index.html#requirements).

Notes:
- there is a `.nvmrc` file in this project if you have `nvm` auto-switching enabled

## Local Testing

- `zapier test` will run the tests, you _have_ to be running node 6.10.2
- `zapier test --debug` will test and output request and response logs

## Deploying

*Note:* These instructions will need updating once our app is public because we'll want to test the private version before promoting it to public.

1. bump the version in `package.json` and commit
2. `zapier push`
3. `zapier migrate {oldVersion} {newVersion}`, eg: `zapier migrate 0.0.6 0.0.7`
4. `zapier history` to check migration status, continue once 100% complete
5. `zapier delete version {oldVersion}`, eg: `zapier delete version 0.0.6`
