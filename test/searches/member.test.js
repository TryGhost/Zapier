import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import nock from 'nock';

import zapier from 'zapier-platform-core';

// Use this to make test calls into your app:
import App from '../../index';
const appTester = zapier.createAppTester(App);

describe('Searches', function () {
    describe('Member', function () {
        let apiMock, authData;

        beforeEach(function () {
            apiMock = nock('http://zapier-test.ghost.io', {
                reqheaders: {
                    'User-Agent': new RegExp(`Zapier/${App.version} GhostAdminSDK/\\d+.\\d+.\\d+`)
                }
            });
            authData = {
                adminApiUrl: 'http://zapier-test.ghost.io',
                adminApiKey: '5c3e1182e79eace7f58c9c3b:7202e874ccae6f1ee6688bb700f356b672fb078d8465860852652037f7c7459ddbd2f2a6e9aa05a40b499ae20027d9f9ba2e5004aa9ab6510b90a5dac674cbc1'
            };
        });

        afterEach(function () {
            nock.cleanAll();
        });

        it('fetches a member by email', function () {
            apiMock.get('/ghost/api/v2/admin/site/').reply(200, {
                site: {version: '3.18.0'}
            });

            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    email: 'ghost-member@example.com'
                }
            });

            apiMock.get(`/ghost/api/v3/admin/members/?filter=email:'ghost-member%40example.com'`)
                .reply(200, {
                    members: [{
                        id: '5951f5fca366002ebd5dbef7',
                        name: 'Ghost',
                        email: 'ghost-member@example.com'
                    }]
                });

            return appTester(App.searches.member.operation.perform, bundle)
                .then((results) => {
                    expect(apiMock.isDone()).toBe(true);
                    expect(results.length).toEqual(1);

                    let [member] = results;
                    expect(member.id).toEqual('5951f5fca366002ebd5dbef7');
                    expect(member.name).toEqual('Ghost');
                    expect(member.email).toEqual('ghost-member@example.com');
                });
        });

        it('fetches a member from a paginated response', function () {
            apiMock.get('/ghost/api/v2/admin/site/').reply(200, {
                site: {version: '3.18.0'}
            });

            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    email: 'ghost-member@example.com'
                }
            });

            // when the response includes pagination meta the admin-api SDK
            // returns an array which must not get double-wrapped
            apiMock.get(`/ghost/api/v3/admin/members/?filter=email:'ghost-member%40example.com'`)
                .reply(200, {
                    members: [{
                        id: '5951f5fca366002ebd5dbef7',
                        name: 'Ghost',
                        email: 'ghost-member@example.com'
                    }],
                    meta: {
                        pagination: {
                            page: 1,
                            limit: 15,
                            pages: 1,
                            total: 1,
                            next: null,
                            prev: null
                        }
                    }
                });

            return appTester(App.searches.member.operation.perform, bundle)
                .then((results) => {
                    expect(apiMock.isDone()).toBe(true);
                    expect(results.length).toEqual(1);

                    let [member] = results;
                    expect(member.id).toEqual('5951f5fca366002ebd5dbef7');
                    expect(member.email).toEqual('ghost-member@example.com');
                });
        });

        it('handles a 404', function () {
            apiMock.get('/ghost/api/v2/admin/site/').reply(200, {
                site: {version: '3.18.0'}
            });

            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    email: 'do-not-exist@example.com'
                }
            });

            apiMock.get(`/ghost/api/v3/admin/members/?filter=email:'do-not-exist%40example.com'`)
                .reply(404, {
                    errors: [{
                        message: 'Resource not found error, cannot read member.',
                        context: 'Subscriber not found.',
                        type: 'NotFoundError',
                        details: null,
                        property: null,
                        help: null,
                        code: null,
                        id: 'f4d2c030-5165-11e9-9864-f79cf99013d0'
                    }]
                });

            return appTester(App.searches.member.operation.perform, bundle)
                .then((results) => {
                    expect(apiMock.isDone()).toBe(true);
                    expect(results.length).toEqual(0);
                });
        });

        it('rethrows errors that are not a 404', function () {
            apiMock.get('/ghost/api/v2/admin/site/').reply(200, {
                site: {version: '3.18.0'}
            });

            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    email: 'ghost-member@example.com'
                }
            });

            apiMock.get(`/ghost/api/v3/admin/members/?filter=email:'ghost-member%40example.com'`)
                .reply(500, {
                    errors: [{
                        message: 'Authorization failed',
                        context: 'Unable to determine the authenticated user or integration. Check that cookies are being passed through if using session authentication.',
                        type: 'NoPermissionError',
                        details: null,
                        property: null,
                        help: null,
                        code: null,
                        id: '34950f70-5148-11e9-9864-f79cf99013d0'
                    }]
                });

            return appTester(App.searches.member.operation.perform, bundle)
                .then(() => {
                    expect.unreachable('expected the call to be rejected');
                }, (err) => {
                    expect(err.name).toEqual('RequestError');
                    expect(err.message).toMatch(/Authorization failed/);
                });
        });

        describe('with unsupported version', function () {
            beforeEach(function () {
                apiMock.get('/ghost/api/v2/admin/site/').reply(200, {
                    site: {version: '2.34'}
                });
            });

            it('shows unsupported error for list', function () {
                let bundle = Object.assign({}, {authData});

                return appTester(App.searches.member.operation.perform, bundle)
                    .then(() => {
                        expect.unreachable('expected the call to be rejected');
                    }, (err) => {
                        expect(err.name).toBe('HaltedError');
                        expect(err.message).toMatch(/does not support member search. Supported version range is >=3.0.0, you are using 2.34/);
                    });
            });
        });
    });
});
