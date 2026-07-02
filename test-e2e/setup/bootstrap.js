/**
 * Bootstraps a fresh Ghost install for the e2e test suite.
 *
 * Runs the Ghost Admin setup flow over HTTP against a running instance:
 * 1. creates the owner user (no auth required on a fresh install)
 * 2. logs in with the owner credentials to obtain a session cookie
 * 3. creates a "Zapier E2E" custom integration and extracts its Admin API key
 *
 * The resulting `GHOST_ADMIN_API_URL` and `GHOST_ADMIN_API_KEY` values are
 * appended to `$GITHUB_ENV` when running in GitHub Actions, otherwise they
 * are written to `test-e2e/.env.local` (gitignored) so the key never
 * appears in logs.
 *
 * Running the e2e suite locally:
 * 1. boot a fresh Ghost on http://localhost:2368 - either point
 *    GHOST_CORE_PATH at a TryGhost/Ghost checkout and run
 *    `test-e2e/setup/start-ghost.sh`, or start any Ghost yourself and set
 *    GHOST_URL if it lives elsewhere
 * 2. `node test-e2e/setup/bootstrap.js`
 * 3. `yarn test:e2e` - the suite picks the credentials up from
 *    test-e2e/.env.local automatically (already-set env vars win)
 */
const http = require('http');
const fs = require('fs');
const {join} = require('path');

const GHOST_URL = process.env.GHOST_URL || 'http://localhost:2368';

const OWNER = {
    name: 'Zapier E2E Owner',
    email: 'zapier-e2e@example.com',
    // Ghost requires passwords to be at least 10 characters long and rejects
    // "insecure" ones (e.g. anything containing the word "password")
    password: 'zapier-e2e-Gh0st',
    blogTitle: 'Zapier E2E'
};

/**
 * @param {string} method HTTP method
 * @param {string} path request path relative to GHOST_URL
 * @param {object} [options]
 * @param {object} [options.body] JSON request body
 * @param {object} [options.headers] additional request headers
 * @returns {Promise<{status: number, headers: object, json: object}>}
 */
const request = (method, path, {body, headers = {}} = {}) => {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const req = http.request(`${GHOST_URL}${path}`, {
            method,
            headers: Object.assign({
                'Content-Type': 'application/json',
                // Ghost's session API requires a matching Origin header
                Origin: GHOST_URL
            }, headers)
        }, (res) => {
            let raw = '';
            res.on('data', chunk => (raw += chunk));
            res.on('end', () => {
                let json = null;
                try {
                    json = raw ? JSON.parse(raw) : null;
                } catch (err) {
                    // non-JSON body (e.g. empty 201 responses) - leave json as null
                }
                resolve({status: res.statusCode, headers: res.headers, json});
            });
        });

        req.on('error', reject);

        // fail fast on a hung Ghost instead of eating the job timeout
        req.setTimeout(15000, () => {
            req.destroy(new Error(`${method} ${path} timed out after 15s`));
        });

        if (payload) {
            req.write(payload);
        }
        req.end();
    });
};

const assertStatus = (step, response, expected) => {
    if (response.status !== expected) {
        const detail = response.json ? JSON.stringify(response.json) : '(no body)';
        throw new Error(`${step} failed: expected HTTP ${expected}, got ${response.status} - ${detail}`);
    }
};

const createOwner = async () => {
    const response = await request('POST', '/ghost/api/admin/authentication/setup/', {
        body: {setup: [OWNER]}
    });
    assertStatus('Owner setup', response, 201);
};

const createSession = async () => {
    const response = await request('POST', '/ghost/api/admin/session/', {
        body: {username: OWNER.email, password: OWNER.password}
    });
    assertStatus('Session login', response, 201);

    const cookies = response.headers['set-cookie'];
    if (!cookies || cookies.length === 0) {
        throw new Error('Session login did not return a session cookie');
    }

    return cookies.map(cookie => cookie.split(';')[0]).join('; ');
};

const createIntegration = async (sessionCookie) => {
    const response = await request('POST', '/ghost/api/admin/integrations/?include=api_keys', {
        body: {integrations: [{name: 'Zapier E2E'}]},
        headers: {Cookie: sessionCookie}
    });
    assertStatus('Integration creation', response, 201);

    const [integration] = response.json.integrations;
    const adminKey = integration.api_keys.find(key => key.type === 'admin');
    if (!adminKey) {
        throw new Error('Integration creation did not return an admin API key');
    }

    // Ghost 5+ returns admin key secrets already in `id:secret` form, older
    // versions return the secret on its own
    return adminKey.secret.includes(':') ? adminKey.secret : `${adminKey.id}:${adminKey.secret}`;
};

const exportCredentials = (adminApiKey) => {
    const lines = [
        `GHOST_ADMIN_API_URL=${GHOST_URL}`,
        `GHOST_ADMIN_API_KEY=${adminApiKey}`
    ];

    // never print the key itself - it would end up in CI or terminal logs
    if (process.env.GITHUB_ENV) {
        fs.appendFileSync(process.env.GITHUB_ENV, `${lines.join('\n')}\n`);
        console.log(`Ghost Admin API credentials appended to ${process.env.GITHUB_ENV}`);
    } else {
        const envFile = join(__dirname, '..', '.env.local');
        fs.writeFileSync(envFile, `${lines.join('\n')}\n`);
        console.log(`Ghost Admin API credentials written to ${envFile}`);
    }
};

const bootstrap = async () => {
    // the request helper uses the core http module, so a https:// (or
    // otherwise non-http) URL would fail confusingly further down
    if (!GHOST_URL.startsWith('http://')) {
        throw new Error(`GHOST_URL must be an http:// URL (got '${GHOST_URL}') - this script only targets local/CI Ghost instances`);
    }

    await createOwner();
    const sessionCookie = await createSession();
    const adminApiKey = await createIntegration(sessionCookie);
    exportCredentials(adminApiKey);
};

// guard so that mocha (or anything else) can require this file without
// triggering the setup flow
if (require.main === module) {
    bootstrap().catch((err) => {
        console.error(err.message);
        process.exit(1);
    });
}

module.exports = {
    bootstrap,
    OWNER
};
