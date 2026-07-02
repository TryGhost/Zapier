require('should');
const nock = require('nock');

const zapier = require('zapier-platform-core');

// Use this to make test calls into your app:
const App = require('../../index');
const appTester = zapier.createAppTester(App);

const sampleTag = {
    slug: 'getting-started',
    id: '5c34b884ba522a02712f01e8',
    name: 'Getting Started',
    description: null,
    feature_image: null,
    visibility: 'public',
    meta_title: null,
    meta_description: null,
    created_at: '2019-01-08T14:49:40.000Z',
    updated_at: '2019-01-08T14:49:40.000Z',
    url: 'http://localhost:2368/tag/getting-started/'
};

describe('Triggers', function () {
    describe('Tag Created', function () {
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

        it('loads tag from webhook data', function () {
            let bundle = Object.assign({}, {authData}, {
                inputData: {},
                cleanedRequest: {
                    user: {
                        current: sampleTag,
                        previous: {}
                    }
                }
            });

            return appTester(App.triggers.tag_created.operation.perform, bundle)
                .then(([tag]) => {
                    tag.id.should.eql('5c34b884ba522a02712f01e8');
                    tag.name.should.eql('Getting Started');
                    tag.slug.should.eql('getting-started');
                });
        });

        it('loads latest tag from list', function () {
            let bundle = Object.assign({}, {authData}, {
                inputData: {},
                meta: {
                    frontend: true
                }
            });

            apiMock.get('/ghost/api/v2/admin/tags/')
                .query({
                    order: 'created_at DESC',
                    limit: 1
                })
                .reply(200, {
                    tags: [sampleTag],
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

            return appTester(App.triggers.tag_created.operation.performList, bundle)
                .then((results) => {
                    apiMock.isDone().should.be.true;
                    results.length.should.eql(1);

                    let [firstTag] = results;
                    firstTag.id.should.eql('5c34b884ba522a02712f01e8');
                    firstTag.name.should.eql('Getting Started');
                });
        });

        it('loads all tags when filling dynamic dropdown', function () {
            let bundle = Object.assign({}, {authData}, {
                inputData: {},
                meta: {
                    isFillingDynamicDropdown: true
                }
            });

            apiMock.get('/ghost/api/v2/admin/tags/')
                .query({
                    order: 'name DESC',
                    limit: 'all'
                })
                .reply(200, {
                    tags: [sampleTag, Object.assign({}, sampleTag, {
                        id: '5c34b884ba522a02712f01e9',
                        name: 'Second Tag',
                        slug: 'second-tag'
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

            return appTester(App.triggers.tag_created.operation.performList, bundle)
                .then((results) => {
                    apiMock.isDone().should.be.true;
                    results.length.should.eql(2);
                });
        });

        it('subscribes to webhook', function () {
            let bundle = Object.assign({}, {authData}, {
                targetUrl: 'https://webooks.zapier.com/ghost/tag_created'
            });

            apiMock.post('/ghost/api/v2/admin/webhooks/', {
                webhooks: [{
                    integration_id: '5c3e1182e79eace7f58c9c3b',
                    target_url: 'https://webooks.zapier.com/ghost/tag_created',
                    event: 'tag.added'
                }]
            }).reply(201, {
                webhooks: [{
                    id: '12345',
                    target_url: 'https://webooks.zapier.com/ghost/tag_created',
                    event: 'tag.added'
                }]
            });

            return appTester(App.triggers.tag_created.operation.performSubscribe, bundle)
                .then(() => {
                    apiMock.isDone().should.be.true;
                });
        });

        it('unsubscribes from webhook', function () {
            let bundle = Object.assign({}, {authData}, {
                subscribeData: {
                    id: '12345',
                    target_url: 'https://webooks.zapier.com/ghost/tag_created',
                    event: 'tag.added'
                }
            });

            apiMock.delete('/ghost/api/v2/admin/webhooks/12345/')
                .reply(204);

            return appTester(App.triggers.tag_created.operation.performUnsubscribe, bundle)
                .then(() => {
                    apiMock.isDone().should.be.true;
                });
        });
    });
});
