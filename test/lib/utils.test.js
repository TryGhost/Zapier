import {createRequire} from 'node:module';

import {describe, it, expect} from 'vitest';

// load via require so this file shares the module instance (and therefore
// the coverage entry) with the tests that reach utils through the app's own
// CommonJS require chain - a direct ESM import would create a second,
// vite-transformed copy and split the coverage between the two
const require = createRequire(import.meta.url);
const {initAdminApi, isNotFoundHaltedError} = require('../../app/lib/utils');
const packageVersion = require('../../package.json').version;

class FakeHaltedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'HaltedError';
    }
}

const authData = {
    adminApiUrl: 'http://zapier-test.ghost.io',
    adminApiKey: '5c3e1182e79eace7f58c9c3b:7202e874ccae6f1ee6688bb700f356b672fb078d8465860852652037f7c7459ddbd2f2a6e9aa05a40b499ae20027d9f9ba2e5004aa9ab6510b90a5dac674cbc1'
};

const buildZ = (response) => {
    const z = {
        requestOptions: null,
        request(options) {
            z.requestOptions = options;
            return Promise.resolve(response);
        },
        errors: {HaltedError: FakeHaltedError}
    };

    return z;
};

describe('Utils', function () {
    describe('initAdminApi', function () {
        it('sets a plain Zapier User-Agent when the SDK sends none', function () {
            const z = buildZ({
                status: 200,
                json: {site: {version: '5.0'}}
            });

            const api = initAdminApi(z, authData, {userAgent: false});

            return api.site.read().then((site) => {
                expect(site.version).toEqual('5.0');
                expect(z.requestOptions.headers['User-Agent']).toEqual(`Zapier/${packageVersion}`);
            });
        });

        it('prefixes the SDK User-Agent with the Zapier version', function () {
            const z = buildZ({
                status: 200,
                json: {site: {version: '5.0'}}
            });

            const api = initAdminApi(z, authData);

            return api.site.read().then(() => {
                expect(z.requestOptions.headers['User-Agent']).toMatch(new RegExp(`^Zapier/${packageVersion} GhostAdminSDK/\\d+\\.\\d+\\.\\d+$`));
            });
        });

        it('falls back to the error message when a halted error has no context', function () {
            const z = buildZ({
                status: 404,
                json: {
                    errors: [{
                        message: 'Resource not found error, cannot read member.',
                        context: null,
                        type: 'NotFoundError',
                        code: null
                    }]
                }
            });

            const api = initAdminApi(z, authData);

            return api.site.read().then(() => {
                expect.unreachable('expected the call to be rejected');
            }, (err) => {
                expect(err.name).toEqual('HaltedError');
                expect(err.message).toEqual('Resource not found error, cannot read member. (NotFoundError)');
            });
        });

        it('marks not-found halted errors with the response status', function () {
            const z = buildZ({
                status: 404,
                json: {
                    errors: [{
                        message: 'Resource not found error, cannot read member.',
                        context: 'Member not found.',
                        type: 'NotFoundError',
                        code: null
                    }]
                }
            });

            const api = initAdminApi(z, authData);

            return api.site.read().then(() => {
                expect.unreachable('expected the call to be rejected');
            }, (err) => {
                expect(err.name).toEqual('HaltedError');
                expect(err.status).toEqual(404);
                expect(isNotFoundHaltedError(err)).toBe(true);
            });
        });

        it('includes the error code in halted validation errors', function () {
            const z = buildZ({
                status: 422,
                json: {
                    errors: [{
                        message: 'Validation error, cannot save member.',
                        context: 'Validation failed for email',
                        type: 'ValidationError',
                        code: 'UNIQUE_EMAIL'
                    }]
                }
            });

            const api = initAdminApi(z, authData);

            return api.site.read().then(() => {
                expect.unreachable('expected the call to be rejected');
            }, (err) => {
                expect(err.name).toEqual('HaltedError');
                expect(err.message).toEqual('Validation failed for email (ValidationError: UNIQUE_EMAIL)');
                expect(isNotFoundHaltedError(err)).toBe(false);
            });
        });
    });
});
