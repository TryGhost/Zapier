import fs from 'fs';
import {join} from 'path';
import {fileURLToPath} from 'url';

import zapier from 'zapier-platform-core';

import App from '../index';

const appTester = zapier.createAppTester(App);

const here = fileURLToPath(new URL('.', import.meta.url));

/**
 * Loads the credentials written by `test-e2e/setup/bootstrap.js` into the
 * environment so a plain `yarn test:e2e` works locally without exporting
 * anything by hand. Already-set variables (e.g. from $GITHUB_ENV in CI)
 * always win over the file.
 */
const loadLocalEnv = () => {
    const envFile = join(here, '.env.local');
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
            'Run the suite via `yarn test:e2e` - with docker running (or ' +
            'GHOST_CORE_PATH pointing at a Ghost checkout) it provisions a ' +
            'fresh Ghost and bootstraps credentials automatically. To ' +
            'manage Ghost yourself, start one and run ' +
            '`node test-e2e/setup/bootstrap.js` first.'
        );
    }

    return {adminApiUrl, adminApiKey};
};

// data seeded by 02-creates.test.js and asserted on by the search and
// trigger specs - the e2e vitest config runs the spec files one at a time
// in filename order. The suite assumes a freshly bootstrapped Ghost
// install; `yarn test:e2e` provisions (and tears down) one per run
// automatically.
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

export {
    App,
    appTester,
    getAuthData,
    fixtures
};
