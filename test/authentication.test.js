import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import nock from 'nock';
import zapier from 'zapier-platform-core';

// Use this to make test calls into your app:
import App from '../index';
const appTester = zapier.createAppTester(App);

describe('Authentication', function () {
    let apiMock, authData;

    beforeEach(function () {
        apiMock = nock('http://zapier-test.ghost.io');
        authData = {
            adminApiUrl: 'http://zapier-test.ghost.io',
            adminApiKey: '5c3e1182e79eace7f58c9c3b:7202e874ccae6f1ee6688bb700f356b672fb078d8465860852652037f7c7459ddbd2f2a6e9aa05a40b499ae20027d9f9ba2e5004aa9ab6510b90a5dac674cbc1'
        };
    });

    afterEach(function () {
        nock.cleanAll();
    });

    describe('test', function () {
        it('is success with valid api key and Ghost 6.0', function () {
            let bundle = Object.assign({}, {authData});

            apiMock.get('/ghost/api/admin/site/')
                .reply(200, {
                    site: {version: '6.0'}
                });

            apiMock.get('/ghost/api/admin/config/')
                .reply(200, {});

            return appTester(App.authentication.test, bundle)
                .then(() => {
                    expect(nock.pendingMocks().length).toEqual(0);
                });
        });

        it('is success with valid api key and a later Ghost version', function () {
            let bundle = Object.assign({}, {authData});

            apiMock.get('/ghost/api/admin/site/')
                .reply(200, {
                    site: {version: '7.2'}
                });

            apiMock.get('/ghost/api/admin/config/')
                .reply(200, {});

            return appTester(App.authentication.test, bundle)
                .then(() => {
                    expect(nock.pendingMocks().length).toEqual(0);
                });
        });

        it('errors with invalid Admin API Key', function () {
            let bundle = Object.assign({}, {authData});

            // emulate Ghost behaviour of unauthed routes not erroring
            apiMock.get('/ghost/api/admin/site/')
                .reply(200, {
                    site: {version: '6.0'}
                });

            apiMock.get('/ghost/api/admin/config/')
                .reply(400, {
                    errors: [{
                        message: 'Invalid token',
                        code: 'INVALID_JWT'
                    }]
                });

            return appTester(App.authentication.test, bundle)
                .then(() => {
                    expect.unreachable('expected the call to be rejected');
                }, (err) => {
                    expect(err.message).toMatch(/^Invalid token/);
                    expect(nock.pendingMocks().length).toEqual(0);
                });
        });

        it('errors with an unsupported Ghost version', function () {
            let bundle = Object.assign({}, {authData});

            apiMock.get('/ghost/api/admin/site/')
                .reply(200, {
                    site: {version: '5.120'}
                });

            return appTester(App.authentication.test, bundle)
                .then(() => {
                    expect.unreachable('expected the call to be rejected');
                }, (err) => {
                    expect(err.message).toMatch(/^Supported Ghost version range is >=6\.0/);
                    expect(err.message).toMatch(/you are using 5\.120/);
                    expect(nock.pendingMocks().length).toEqual(0);
                });
        });

        it('errors when the Admin API is not found', function () {
            let bundle = Object.assign({}, {authData});

            // a 404 means a non-Ghost site or a Ghost too old to serve the
            // unversioned Admin API
            apiMock.get('/ghost/api/admin/site/')
                .reply(404);

            return appTester(App.authentication.test, bundle)
                .then(() => {
                    expect.unreachable('expected the call to be rejected');
                }, (err) => {
                    expect(err.message).toMatch(/^Supplied 'Admin API URL' does not point to a Ghost site with a supported version \(>=6\.0\)/);
                    expect(nock.pendingMocks().length).toEqual(0);
                });
        });
    });
});
