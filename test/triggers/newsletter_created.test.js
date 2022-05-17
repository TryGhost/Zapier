require('should');
const nock = require('nock');

const zapier = require('zapier-platform-core');

// Use this to make test calls into your app:
const App = require('../../index');
const appTester = zapier.createAppTester(App);

describe('Triggers', function () {
    describe('Newsletter Created', function () {
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
                    site: {version: '5.0'}
                });
            });

            it('loads newsletter from webhook data', function () {
                let bundle = Object.assign({}, {authData}, {
                    inputData: {},
                    cleanedRequest: {
                        newsletter: {
                            current: {
                                id: '627be9e49278a3c9b09f8883',
                                name: 'Default newsletter',
                                description: 'Thoughts, stories and ideas.',
                                slug: 'default-newsletter',
                                created_at: '2019-03-22T08:39:02.890Z',
                                updated_at: '2019-03-22T08:39:02.890Z'
                            },
                            previous: {}
                        }
                    }
                });

                return appTester(App.triggers.newsletter_created.operation.perform, bundle)
                    .then(([newsletter]) => {
                        newsletter.id.should.eql('627be9e49278a3c9b09f8883');
                        newsletter.name.should.eql('Default newsletter');
                        newsletter.slug.should.eql('default-newsletter');
                    });
            });

            it('loads newsletter from list', function () {
                let bundle = Object.assign({}, {authData}, {
                    inputData: {},
                    meta: {
                        frontend: true
                    }
                });

                apiMock.get('/ghost/api/v2/admin/newsletters/')
                    .query({
                        order: 'created_at DESC',
                        limit: 1
                    })
                    .reply(200, {
                        newsletters: [{
                            id: '627be9e49278a3c9b09f8883',
                            name: 'Default newsletter',
                            description: 'Thoughts, stories and ideas.',
                            slug: 'default-newsletter',
                            created_at: '2019-03-22T08:39:02.890Z',
                            updated_at: '2019-03-22T08:39:02.890Z'
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

                return appTester(App.triggers.newsletter_created.operation.performList, bundle)
                    .then((results) => {
                        apiMock.isDone().should.be.true;
                        results.length.should.eql(1);

                        let [firstNewsletter] = results;
                        firstNewsletter.id.should.eql('627be9e49278a3c9b09f8883');
                        firstNewsletter.name.should.eql('Default newsletter');
                        firstNewsletter.slug.should.eql('default-newsletter');
                    });
            });

            it('subscribes to webhook', function () {
                let bundle = Object.assign({}, {authData}, {
                    targetUrl: 'https://webooks.zapier.com/ghost/newsletter'
                });

                apiMock.post('/ghost/api/v2/admin/webhooks/', {
                    webhooks: [{
                        integration_id: '5c3e1182e79eace7f58c9c3b',
                        target_url: 'https://webooks.zapier.com/ghost/newsletter',
                        event: 'newsletter.added'
                    }]
                }).reply(201, {
                    webhooks: [{
                        id: '12345',
                        target_url: 'https://webooks.zapier.com/ghost/newsletter',
                        event: 'newsletter.added'
                    }]
                });

                return appTester(App.triggers.newsletter_created.operation.performSubscribe, bundle)
                    .then(() => {
                        apiMock.isDone().should.be.true;
                    });
            });

            it('unsubscribes from webhook', function () {
                let bundle = Object.assign({}, {authData}, {
                    subscribeData: {
                        id: '12345',
                        target_url: 'https://webooks.zapier.com/ghost/member',
                        event: 'newsletter.added'
                    }
                });

                apiMock.delete('/ghost/api/v2/admin/webhooks/12345/')
                    .reply(204);

                return appTester(App.triggers.newsletter_created.operation.performUnsubscribe, bundle)
                    .then(() => {
                        apiMock.isDone().should.be.true;
                    });
            });
        });

        describe('with unsupported version', function () {
            beforeEach(function () {
                apiMock.get('/ghost/api/v2/admin/site/').reply(200, {
                    site: {version: '4.46'}
                });
            });

            it('shows unsupported error for list', function () {
                let bundle = Object.assign({}, {authData}, {
                    meta: {
                        isFillingDynamicDropdown: true
                    }
                });

                return appTester(App.triggers.newsletter_created.operation.performList, bundle)
                    .then(() => {
                        true.should.equal(false);
                    }, (err) => {
                        // err.name.should.equal('HaltedError');
                        err.message.should.match(/does not support newsletters. Supported version range is >=5.0.0, you are using 4.46/);
                    });
            });
        });
    });
});
