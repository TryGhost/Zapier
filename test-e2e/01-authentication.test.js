// Runs against a real Ghost instance - see test-e2e/setup/bootstrap.js
import { describe, it, expect, beforeAll } from 'vitest';

import { App, appTester, getAuthData } from './helpers';
import { OWNER } from './setup/bootstrap';

describe('E2E Authentication', function () {
    let authData;

    beforeAll(function () {
        authData = getAuthData();
    });

    it('succeeds with the bootstrapped Admin API key', async function () {
        const result = await appTester(App.authentication.test, { authData });

        expect(result.blogTitle).toBe(OWNER.blogTitle);
        expect(result.blogUrl.startsWith(authData.adminApiUrl)).toBe(true);
    });

    it('fails with an incorrect Admin API key secret', async function () {
        const [keyId] = authData.adminApiKey.split(':');
        const badAuthData = {
            adminApiUrl: authData.adminApiUrl,
            adminApiKey: `${keyId}:${'0'.repeat(64)}`,
        };

        // Ghost rejects the mis-signed token with "Invalid token: invalid
        // signature" - matching on it proves a real credential rejection
        // rather than any incidental failure (network, wrong URL, ...)
        await expect(appTester(App.authentication.test, { authData: badAuthData })).rejects.toThrow(
            /invalid token/i,
        );
    });
});
