require('should');
const nock = require('nock');

const zapier = require('zapier-platform-core');

// Use this to make test calls into your app:
const App = require('../../index');
const appTester = zapier.createAppTester(App);

// indexes of the dynamic field functions within operation.inputFields
const PUBLISHED_AT_FIELD = 3;
const CONTENT_FIELD = 5;

describe('Creates', function () {
    describe('Create Post', function () {
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

        it('creates a post from html, mapping tag and author slugs', function () {
            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    title: 'Test Post',
                    status: 'draft',
                    content_format: 'html',
                    html: '<p>Test content</p>',
                    mobiledoc: '{"version":"0.3.1"}',
                    tags: ['getting-started'],
                    authors: ['ghost']
                }
            });

            // html input is converted server-side, so the `source=html` query
            // param must be present and the unused mobiledoc content dropped
            apiMock.post('/ghost/api/v2/admin/posts/?source=html', {
                posts: [{
                    title: 'Test Post',
                    status: 'draft',
                    html: '<p>Test content</p>',
                    tags: [{slug: 'getting-started'}],
                    authors: [{slug: 'ghost'}]
                }]
            }).reply(201, {
                posts: [{
                    id: '5c34ce2370401002b874c585',
                    title: 'Test Post',
                    slug: 'test-post',
                    status: 'draft'
                }]
            });

            return appTester(App.creates.create_post.operation.perform, bundle)
                .then((post) => {
                    apiMock.isDone().should.be.true;

                    post.id.should.eql('5c34ce2370401002b874c585');
                    post.title.should.eql('Test Post');
                    post.slug.should.eql('test-post');
                });
        });

        it('creates a post from mobiledoc, dropping unused html content', function () {
            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    title: 'Test Post',
                    status: 'published',
                    content_format: 'mobiledoc',
                    mobiledoc: '{"version":"0.3.1"}',
                    html: '<p>Test content</p>'
                }
            });

            apiMock.post('/ghost/api/v2/admin/posts/', {
                posts: [{
                    title: 'Test Post',
                    status: 'published',
                    mobiledoc: '{"version":"0.3.1"}',
                    tags: [],
                    authors: []
                }]
            }).reply(201, {
                posts: [{
                    id: '5c34ce2370401002b874c585',
                    title: 'Test Post',
                    slug: 'test-post',
                    status: 'published'
                }]
            });

            return appTester(App.creates.create_post.operation.perform, bundle)
                .then((post) => {
                    apiMock.isDone().should.be.true;

                    post.id.should.eql('5c34ce2370401002b874c585');
                    post.status.should.eql('published');
                });
        });

        it('requires published_at when the post is scheduled', function () {
            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    status: 'scheduled'
                }
            });

            return appTester(App.creates.create_post.operation.inputFields[PUBLISHED_AT_FIELD], bundle)
                .then(([field]) => {
                    field.key.should.eql('published_at');
                    field.required.should.eql(true);
                    field.type.should.eql('datetime');
                });
        });

        it('does not require published_at for other statuses', function () {
            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    status: 'draft'
                }
            });

            return appTester(App.creates.create_post.operation.inputFields[PUBLISHED_AT_FIELD], bundle)
                .then(([field]) => {
                    field.key.should.eql('published_at');
                    field.required.should.eql(false);
                });
        });

        it('shows the html content field for html format', function () {
            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    content_format: 'html'
                }
            });

            return appTester(App.creates.create_post.operation.inputFields[CONTENT_FIELD], bundle)
                .then(([field]) => {
                    field.key.should.eql('html');
                    field.type.should.eql('text');
                });
        });

        it('shows the mobiledoc content field for mobiledoc format', function () {
            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    content_format: 'mobiledoc'
                }
            });

            return appTester(App.creates.create_post.operation.inputFields[CONTENT_FIELD], bundle)
                .then(([field]) => {
                    field.key.should.eql('mobiledoc');
                    field.type.should.eql('text');
                });
        });
    });
});
