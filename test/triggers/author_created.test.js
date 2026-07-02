require('should');
const nock = require('nock');

const zapier = require('zapier-platform-core');

// Use this to make test calls into your app:
const App = require('../../index');
const appTester = zapier.createAppTester(App);

const sampleAuthor = {
    slug: 'ghost',
    id: '5951f5fca366002ebd5dbef7',
    name: 'Ghost',
    email: 'ghost-author@example.com',
    profile_image: 'https://static.ghost.org/v2.0.0/images/ghost.png',
    cover_image: null,
    bio: 'You can delete this user to remove all the welcome posts',
    website: 'https://ghost.org',
    location: 'The Internet',
    facebook: 'ghost',
    twitter: 'tryghost',
    accessibility: null,
    status: 'active',
    meta_title: null,
    meta_description: null,
    tour: null,
    last_seen: null,
    created_at: '2019-01-08T14:49:40.000Z',
    updated_at: '2019-01-08T14:49:40.000Z',
    url: 'http://localhost:2368/author/ghost/'
};

describe('Triggers', function () {
    describe('Author Created', function () {
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

        it('loads author from webhook data', function () {
            let bundle = Object.assign({}, {authData}, {
                inputData: {},
                cleanedRequest: {
                    user: {
                        current: sampleAuthor,
                        previous: {}
                    }
                }
            });

            return appTester(App.triggers.author_created.operation.perform, bundle)
                .then(([author]) => {
                    author.id.should.eql('5951f5fca366002ebd5dbef7');
                    author.name.should.eql('Ghost');
                    author.slug.should.eql('ghost');
                });
        });

        it('loads latest author from list', function () {
            let bundle = Object.assign({}, {authData}, {
                inputData: {},
                meta: {
                    frontend: true
                }
            });

            apiMock.get('/ghost/api/v2/admin/users/')
                .query({
                    order: 'created_at DESC',
                    limit: 1
                })
                .reply(200, {
                    users: [sampleAuthor],
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

            return appTester(App.triggers.author_created.operation.performList, bundle)
                .then((results) => {
                    apiMock.isDone().should.be.true;
                    results.length.should.eql(1);

                    let [firstAuthor] = results;
                    firstAuthor.id.should.eql('5951f5fca366002ebd5dbef7');
                    firstAuthor.name.should.eql('Ghost');
                });
        });

        it('loads all authors when filling dynamic dropdown', function () {
            let bundle = Object.assign({}, {authData}, {
                inputData: {},
                meta: {
                    isFillingDynamicDropdown: true
                }
            });

            apiMock.get('/ghost/api/v2/admin/users/')
                .query({
                    order: 'name DESC',
                    limit: 'all'
                })
                .reply(200, {
                    users: [sampleAuthor, Object.assign({}, sampleAuthor, {
                        id: '5951f5fca366002ebd5dbef8',
                        name: 'Second Author',
                        slug: 'second-author'
                    })],
                    meta: {
                        pagination: {
                            page: 1,
                            limit: 'all',
                            pages: 1,
                            total: 2,
                            next: null,
                            prev: null
                        }
                    }
                });

            return appTester(App.triggers.author_created.operation.performList, bundle)
                .then((results) => {
                    apiMock.isDone().should.be.true;
                    results.length.should.eql(2);
                });
        });

        it('subscribes to webhook', function () {
            let bundle = Object.assign({}, {authData}, {
                targetUrl: 'https://webooks.zapier.com/ghost/author_created'
            });

            apiMock.post('/ghost/api/v2/admin/webhooks/', {
                webhooks: [{
                    integration_id: '5c3e1182e79eace7f58c9c3b',
                    target_url: 'https://webooks.zapier.com/ghost/author_created',
                    event: 'user.added'
                }]
            }).reply(201, {
                webhooks: [{
                    id: '12345',
                    target_url: 'https://webooks.zapier.com/ghost/author_created',
                    event: 'user.added'
                }]
            });

            return appTester(App.triggers.author_created.operation.performSubscribe, bundle)
                .then(() => {
                    apiMock.isDone().should.be.true;
                });
        });

        it('unsubscribes from webhook', function () {
            let bundle = Object.assign({}, {authData}, {
                subscribeData: {
                    id: '12345',
                    target_url: 'https://webooks.zapier.com/ghost/author_created',
                    event: 'user.added'
                }
            });

            apiMock.delete('/ghost/api/v2/admin/webhooks/12345/')
                .reply(204);

            return appTester(App.triggers.author_created.operation.performUnsubscribe, bundle)
                .then(() => {
                    apiMock.isDone().should.be.true;
                });
        });
    });
});
