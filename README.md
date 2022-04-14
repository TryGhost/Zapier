# Ghost-Zapier

## Getting started
The app is built using "Zapier Platform CLI". An introductory guide into building and maintaining such apps is available [here](https://platform.zapier.com/cli_tutorials/getting-started).

Quick command reference to get started with development:
```
# install the CLI globally
yarn global add zapier-platform-cli

# setup auth to Zapier's platform with a deploy key
zapier login

# setup dependencies
yarn

zapier test
```

## Node version support

All Zapier CLI apps are run using Node.js >=14.x. More details are available in the [requirements doc](https://zapier.github.io/zapier-platform-cli/index.html#requirements).

Notes:
- there is a `.nvmrc` file in this project if you have `nvm` auto-switching enabled

## Ghost version support

Zapier checks the version of Ghost when authenticating to ensure that the API supports the required webhooks endpoints and other features. This is done by fetching the `/ghost/api/v2/admin/site/` endpoint.

When a new major version of Ghost is released the [supported version string](https://github.com/TryGhost/Ghost-Zapier/blob/4739696c1dde5a197ea89531536deebfab8f57ab/app/authentication.js#L4) must be updated!

## Useful resources

- [Integration review guidelines](https://platform.zapier.com/partners/integration-review-guidelines) - guidelines on best practices when publishing a new integration. Useful to keep in mind when developing new features
- [A guideline](https://zapier.com/developer/documentation/v2/planning-guide-v1/#update-actions) about how to best approach feature design in Zapier integration.

## Local Testing

- `zapier test` will run the tests
- `zapier test --debug` will test and output request and response logs

## Deploying

There are couple usecases where you would need to do a deploy:
1. When releasing a new "private" version for testing by invited users
2. When releasing a "public" version into the wild
3. Migrate existing integration users to a newly released version

#### To deploy a "private" version:
1. bump the version in `package.json` (do not commit)
2. `zapier push`

Tips:
- to test if the private version works in "close-to-live" environment you can migrate a single user account's Zaps to the new version by running: `zapier migrate 2.4.0 2.4.1 --user=user@example.com`. Check if the migrations completed through `zapier history`.

#### To deploy a "public" version:
1. bump the version in `package.json`
2. update `CHANGELOG.md`
3. commit above changes with a message matching a new version, e.g. `git commit -m "2.4.0"`
4. add a tag with a new version, e.g. `git tag 2.4.0`
5. push out new commit and a tag upstream e.g. `git push upstream main --tags`
6. `zapier push`
7. `zapier promote {newVersion}` - only new integrations will use this version

#### To migrate existing users to a new version
1. `zapier migrate {oldVersion} {newVersion} {percentage}`, eg: `zapier migrate 2.3.1 2.4.0 10`, move 10% of users between versions (recommended to do gradual rollout and monitor for errors before migrating 100% to a new version)
2. `zapier history` to check migration status, continue once 100% complete

Full [Zapier reference](https://platform.zapier.com/cli_docs/docs#deploying-an-app-version) for deploying a new version.

## Testing Zaps locally
Before releasing a new version a common thing to do is checking if the changes work in production-like environment. Follow these steps to debug Zapier requests on a local Ghost instance:
1. Deploy a "private" version descrived in the #Deploying section. Make sure to follow the migration instruction to add yourself to the private version users pool.
2. Expose your local Ghost instance to the world to be able to reach it from Zapier side. As a one-liner can use `ngrok` to do so by running: `ngrok http http://localhost:2368` 
3. Go to you Zapier account (regular user account) and create a new Zap
4. When choosing the trigger search for `Ghost` and select the private version under test.
5. Connect Zapier to your local instance, which is reachable through a URL like `https://8a4e-101-128-86-58.ngrok.io` if ngrok was used.
6. Create Zap as usual. And test requests will start coming in to your local Ghost instance.

To trigger configured above Zap use your local Ghost instance as usual and the Zaps should start getting triggered as expected. If you don't see any comming through check out Zapier's error dashboard to debug the problem.
# Copyright & License 

Copyright (c) 2013-2022 Ghost Foundation - Released under the [MIT license](LICENSE).
