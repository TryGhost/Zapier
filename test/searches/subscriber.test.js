import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import nock from 'nock';

import zapier from 'zapier-platform-core';

// Use this to make test calls into your app:
import App from '../../index';
const appTester = zapier.createAppTester(App);

describe('Searches', function () {
    describe('Subscriber', function () {
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

        describe('with supported version', function () {
            beforeEach(function () {
                apiMock.get('/ghost/api/v2/admin/site/').reply(200, {
                    site: {version: '2.34'}
                });
            });

            it('fetches a subscriber by email', function () {
                let bundle = Object.assign({}, {authData}, {
                    inputData: {
                        email: 'test@example.com'
                    }
                });

                apiMock.get('/ghost/api/v2/admin/subscribers/email/test@example.com/')
                    .reply(200, {
                        subscribers: [{
                            email: 'test@example.com',
                            id: '5c9cd98a51b5bf974afad2a6',
                            name: 'Test Subscriber',
                            status: 'subscribed',
                            post_id: null,
                            subscribed_url: null,
                            subscribed_referrer: null,
                            unsubscribed_url: null,
                            unsubscribed_at: null,
                            created_at: '2019-03-28T14:26:18.000Z',
                            updated_at: '2019-03-28T14:26:18.000Z'
                        }]
                    });

                return appTester(App.searches.subscriber.operation.perform, bundle)
                    .then((results) => {
                        expect(apiMock.isDone()).toBe(true);
                        expect(results.length).toEqual(1);

                        let [firstSubscriber] = results;
                        expect(firstSubscriber.id).toEqual('5c9cd98a51b5bf974afad2a6');
                        expect(firstSubscriber.name).toEqual('Test Subscriber');
                        expect(firstSubscriber.email).toEqual('test@example.com');
                    });
            });

            it('handles a 404', function () {
                let bundle = Object.assign({}, {authData}, {
                    inputData: {
                        email: 'unknown@example.com'
                    }
                });

                apiMock.get('/ghost/api/v2/admin/subscribers/email/unknown@example.com/')
                    .reply(404, {
                        errors: [{
                            message: 'Resource not found error, cannot read subscriber.',
                            context: 'Subscriber not found.',
                            type: 'NotFoundError',
                            details: null,
                            property: null,
                            help: null,
                            code: null,
                            id: 'f4d2c030-5165-11e9-9864-f79cf99013d0'
                        }]
                    });

                return appTester(App.searches.subscriber.operation.perform, bundle)
                    .then((results) => {
                        expect(apiMock.isDone()).toBe(true);
                        expect(results.length).toEqual(0);
                    });
            });

            it('handles a validation error', function () {
                let bundle = Object.assign({}, {authData}, {
                    inputData: {
                        email: 'unknown'
                    }
                });

                apiMock.get('/ghost/api/v2/admin/subscribers/email/unknown/')
                    .reply(422, {
                        errors: [{
                            message: 'Validation error, cannot read subscriber.',
                            context: 'Validation (isEmail) failed for email',
                            type: 'ValidationError',
                            details: null,
                            property: null,
                            help: null,
                            code: null,
                            id: 'fb5a30d0-517b-11e9-9864-f79cf99013d0'
                        }]
                    });

                return appTester(App.searches.subscriber.operation.perform, bundle)
                    .then(() => {
                        expect.unreachable('expected the call to be rejected');
                    }, (err) => {
                        expect(err.name).toEqual('HaltedError');
                        expect(err.message).toMatch(/Validation \(isEmail\)/i);
                    });
            });
        });

        describe('with unsupported version', function () {
            beforeEach(function () {
                apiMock.get('/ghost/api/v2/admin/site/').reply(200, {
                    site: {version: '3.0'}
                });
            });

            it('shows unsupported error message', function () {
                let bundle = Object.assign({}, {authData}, {
                    inputData: {
                        email: 'test@example.com'
                    }
                });

                return appTester(App.searches.subscriber.operation.perform, bundle)
                    .then(() => {
                        expect.unreachable('expected the call to be rejected');
                    }, (err) => {
                        expect(err.name).toBe('HaltedError');
                        expect(err.message).toMatch(/does not support subscribers. Supported version range is <3.0.0, you are using 3.0/);
                    });
            });
        });
    });
});
