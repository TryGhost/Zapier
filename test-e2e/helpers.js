const fs = require('fs');
const {join} = require('path');

const should = require('should');
const zapier = require('zapier-platform-core');

const App = require('../index');

const appTester = zapier.createAppTester(App);

/**
 * Loads the credentials written by `test-e2e/setup/bootstrap.js` into the
 * environment so a plain `yarn test:e2e` works locally without exporting
 * anything by hand. Already-set variables (e.g. from $GITHUB_ENV in CI)
 * always win over the file.
 */
const loadLocalEnv = () => {
    const envFile = join(__dirname, '.env.local');
    if (!fs.existsSync(envFile)) {
        return;
    }

    for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
        const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (match && !process.env[match[1]]) {
            process.env[match[1]] = match[2];
        }
    }
};

/**
 * Auth data pointing at the real Ghost instance bootstrapped by
 * `test-e2e/setup/bootstrap.js`. Fails fast with a setup hint when the
 * environment is missing so a bare `yarn test:e2e` doesn't produce a wall of
 * confusing network errors.
 *
 * @returns {object} authData bundle fragment
 */
const getAuthData = () => {
    loadLocalEnv();

    const adminApiUrl = process.env.GHOST_ADMIN_API_URL;
    const adminApiKey = process.env.GHOST_ADMIN_API_KEY;

    if (!adminApiUrl || !adminApiKey) {
        throw new Error(
            'GHOST_ADMIN_API_URL and GHOST_ADMIN_API_KEY must be set. ' +
            'Start a Ghost instance on http://localhost:2368 (e.g. via ' +
            '`test-e2e/setup/start-ghost.sh` with GHOST_CORE_PATH pointing ' +
            'at a Ghost checkout) and run `node test-e2e/setup/bootstrap.js` ' +
            'first - after that a plain `yarn test:e2e` picks the ' +
            'credentials up from test-e2e/.env.local automatically.'
        );
    }

    return {adminApiUrl, adminApiKey};
};

/**
 * Asserts that a promise rejects with a HaltedError whose message matches.
 *
 * @param {Promise} promise the in-flight appTester call
 * @param {RegExp} messagePattern expected error message
 */
const shouldHalt = async (promise, messagePattern) => {
    const error = await promise.then(
        () => should.fail('expected a HaltedError but the call succeeded'),
        err => err
    );

    error.name.should.equal('HaltedError');
    error.message.should.match(messagePattern);
};

// data seeded by 02-creates.test.js and asserted on by the search and
// trigger specs - mocha loads the spec files in alphabetical order.
// The suite assumes a freshly bootstrapped Ghost install (as in CI), so
// restart the container before re-running locally.
const fixtures = {
    member: {
        name: 'E2E Member',
        email: 'e2e-member@example.com',
        note: 'Created by the Zapier e2e suite'
    },
    publishedPost: {
        title: 'E2E Published Post',
        html: '<p>Published by the Zapier e2e suite.</p>'
    },
    scheduledPost: {
        title: 'E2E Scheduled Post',
        html: '<p>Scheduled by the Zapier e2e suite.</p>'
    },
    tagSlug: 'e2e-zapier',
    missingEmail: 'e2e-does-not-exist@example.com',
    missingSlug: 'e2e-does-not-exist'
};

module.exports = {
    App,
    appTester,
    getAuthData,
    shouldHalt,
    fixtures
};
