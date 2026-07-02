// Runs against a real Ghost instance - see test-e2e/setup/bootstrap.js
require('should');

const {App, appTester, getAuthData} = require('./helpers');
const {OWNER} = require('./setup/bootstrap');

describe('E2E Authentication', function () {
    let authData;

    before(function () {
        authData = getAuthData();
    });

    it('succeeds with the bootstrapped Admin API key', async function () {
        const result = await appTester(App.authentication.test, {authData});

        result.blogTitle.should.equal(OWNER.blogTitle);
        result.blogUrl.should.startWith(authData.adminApiUrl);
    });

    it('fails with an incorrect Admin API key secret', async function () {
        const [keyId] = authData.adminApiKey.split(':');
        const badAuthData = {
            adminApiUrl: authData.adminApiUrl,
            adminApiKey: `${keyId}:${'0'.repeat(64)}`
        };

        await appTester(App.authentication.test, {authData: badAuthData})
            .should.be.rejected();
    });
});
