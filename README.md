# Ghost-Zapier

## Getting started
The app is build using "Zapier Platform CLI". An introductory guide into building and maintaining such apps is available [here](https://platform.zapier.com/cli_tutorials/getting-started).

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

#### To deploy a "public" version:
1. bump the version in `package.json`
2. update `CHANGELOG.md`
3. commit above changes with a message matching a new version, e.g. `git commit -m "2.4.0"`
4. add a tag with a new version, e.g. `git tag 2.4.0`
5. push out new commit and a tag upstream
6. `zapier push`
7. `zapier promote {newVersion}` - only new integrations will use this version

#### To migrate existing users to a new version
1. `zapier migrate {oldVersion} {newVersion} {percentage}`, eg: `zapier migrate 2.3.1 2.4.0 10`, move 10% of users between versions (recommended to do gradual rollout and monitor for errors before migrating 100% to a new version)
2. `zapier history` to check migration status, continue once 100% complete

Full [Zapier reference](https://platform.zapier.com/cli_docs/docs#deploying-an-app-version) for deploying a new version.


# Copyright & License 

Copyright (c) 2013-2021 Ghost Foundation - Released under the [MIT license](LICENSE).
