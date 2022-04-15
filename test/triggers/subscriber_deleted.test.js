require('should');
const nock = require('nock');

const zapier = require('zapier-platform-core');

// Use this to make test calls into your app:
const App = require('../../index');
const appTester = zapier.createAppTester(App);

describe('Triggers', function () {
    describe('Subscriber Deleted', function () {
        let apiMock, authData;

        beforeEach(function () {
            apiMock = nock('http://zapier-test.ghost.io', {
                reqheaders: {
                 'User-Agent': new RegExp(`Zapier\/${App.version} GhostAdminSDK\/\\d+.\\d+.\\d+`)
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

            it('loads subscriber from fake hook', function () {
                let bundle = Object.assign({}, {authData}, {
                    inputData: {},
                    cleanedRequest: {
                        subscriber: {
                            current: {},
                            previous: {
                                id: '5c9a1929da323575684e5786',
                                name: 'Test Subscriber',
                                email: 'test@example.com',
                                status: 'subscribed',
                                post_id: null,
                                subscribed_url: null,
                                subscribed_referrer: null,
                                unsubscribed_url: null,
                                unsubscribed_at: null,
                                created_at: '2019-03-26T12:20:57.000Z',
                                updated_at: '2019-03-26T12:20:57.000Z'
                            }
                        },
                        subscribers: [
                            {
                                id: '5c9a1929da323575684e5786',
                                name: 'Test Subscriber',
                                email: 'test@example.com',
                                status: 'subscribed',
                                post_id: null,
                                subscribed_url: null,
                                subscribed_referrer: null,
                                unsubscribed_url: null,
                                unsubscribed_at: null,
                                created_at: '2019-03-26T12:20:57.000Z',
                                updated_at: '2019-03-26T12:20:57.000Z'
                            }
                        ]
                    }
                });

                return appTester(App.triggers.subscriber_deleted.operation.perform, bundle)
                    .then(([subscriber]) => {
                        subscriber.id.should.eql('5c9a1929da323575684e5786');
                        subscriber.name.should.eql('Test Subscriber');
                        subscriber.email.should.eql('test@example.com');
                    });
            });

            it('loads subscriber from list', function () {
                let bundle = Object.assign({}, {authData}, {
                    inputData: {},
                    meta: {
                        frontend: true
                    }
                });

                apiMock.get('/ghost/api/v2/admin/subscribers/')
                    .query({
                        order: 'created_at DESC',
                        limit: 1
                    })
                    .reply(200, {
                        subscribers: [{
                            id: 'one',
                            name: 'Subscriber One',
                            email: 'one@example.com',
                            post_id: '5a1d8648a629fc69c2706d29',
                            status: 'subscribed',
                            subscribed_referrer: 'http://ghost.blog/',
                            subscribed_url: 'http://ghost.blog/the-editor-2/',
                            unsubscribed_at: null,
                            unsubscribed_url: null,
                            updated_at: '2017-12-13T16:33:24.000Z',
                            updated_by: '5a315654eddbd3ce4c0cd92c'
                        }],
                        meta: {
                            pagination: {
                                page: 1,
                                limit: 1,
                                pages: 1,
                                total: 1,
                                next: null,
                                prev: null
                            }
                        }
                    });

                return appTester(App.triggers.subscriber_deleted.operation.performList, bundle)
                    .then((results) => {
                        apiMock.isDone().should.be.true;
                        results.length.should.eql(1);

                        let [firstSubscriber] = results;
                        firstSubscriber.id.should.eql('one');
                        firstSubscriber.name.should.eql('Subscriber One');
                        firstSubscriber.email.should.eql('one@example.com');
                    });
            });

            it('subscribes to webhook', function () {
                let bundle = Object.assign({}, {authData}, {
                    targetUrl: 'https://webooks.zapier.com/ghost/subscriber'
                });

                apiMock
                    .post('/ghost/api/v2/admin/webhooks/', {
                        webhooks: [{
                            integration_id: '5c3e1182e79eace7f58c9c3b',
                            target_url: 'https://webooks.zapier.com/ghost/subscriber',
                            event: 'subscriber.deleted'
                        }]
                    })
                    .reply(201, {
                        webhooks: [{
                            id: 'subscribe-test',
                            target_url: 'https://webooks.zapier.com/ghost/subscriber',
                            event: 'subscriber.deleted'
                        }]
                    });

                return appTester(App.triggers.subscriber_deleted.operation.performSubscribe, bundle)
                    .then(() => {
                        apiMock.isDone().should.be.true;
                    });
            });

            it('unsubscribes from webhook', function () {
                let bundle = Object.assign({}, {authData}, {
                    subscribeData: {
                        id: 'subscribe-test',
                        target_url: 'https://webooks.zapier.com/ghost/subscriber',
                        event: 'subscriber.deleted'
                    }
                });

                apiMock
                    .delete('/ghost/api/v2/admin/webhooks/subscribe-test/')
                    .reply(204);

                return appTester(App.triggers.subscriber_deleted.operation.performUnsubscribe, bundle)
                    .then(() => {
                        apiMock.isDone().should.be.true;
                    });
            });
        });

        describe('with unsupported version', function () {
            beforeEach(function () {
                apiMock.get('/ghost/api/v2/admin/site/').reply(200, {
                    site: {version: '3.0'}
                });
            });

            it('shows unsupported error for list', function () {
                let bundle = Object.assign({}, {authData});

                return appTester(App.triggers.subscriber_deleted.operation.performList, bundle)
                    .then(() => {
                        true.should.equal(false);
                    }, (err) => {
                        err.name.should.equal('HaltedError');
                        err.message.should.match(/does not support subscribers. Supported version range is <3.0.0, you are using 3.0/);
                    });
            });

            it('shows unsupported error when subscribing', function () {
                let bundle = Object.assign({}, {authData}, {
                    targetUrl: 'https://webooks.zapier.com/ghost/subscriber'
                });

                return appTester(App.triggers.subscriber_deleted.operation.performSubscribe, bundle)
                    .then(() => {
                        true.should.equal(false);
                    }, (err) => {
                        err.name.should.equal('HaltedError');
                        err.message.should.match(/does not support subscribers. Supported version range is <3.0.0, you are using 3.0/);
                    });
            });

            it('shows unsupported error when unsubscribing', function () {
                let bundle = Object.assign({}, {authData}, {
                    subscribeData: {
                        id: '12345',
                        target_url: 'https://webooks.zapier.com/ghost/subscriber',
                        event: 'subscriber.added'
                    }
                });

                return appTester(App.triggers.subscriber_deleted.operation.performUnsubscribe, bundle)
                    .then(() => {
                        true.should.equal(false);
                    }, (err) => {
                        err.name.should.equal('HaltedError');
                        err.message.should.match(/does not support subscribers. Supported version range is <3.0.0, you are using 3.0/);
                    });
            });
        });
    });
});
