require('should');
const nock = require('nock');

const zapier = require('zapier-platform-core');

// Use this to make test calls into your app:
const App = require('../../index');
const appTester = zapier.createAppTester(App);

describe('Searches', function () {
    describe('Subscriber', function () {
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

        it('fetches an author by email', function () {
            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    search_by: 'email',
                    email: 'ghost-author@example.com'
                }
            });

            apiMock.get('/ghost/api/v2/admin/users/email/ghost-author@example.com/')
                .reply(200, {
                    users: [{
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
                    }]
                });

            return appTester(App.searches.author.operation.perform, bundle)
                .then((results) => {
                    apiMock.isDone().should.be.true;
                    results.length.should.eql(1);

                    let [firstAuthor] = results;
                    firstAuthor.id.should.eql('5951f5fca366002ebd5dbef7');
                    firstAuthor.name.should.eql('Ghost');
                    firstAuthor.email.should.eql('ghost-author@example.com');
                    firstAuthor.slug.should.eql('ghost');
                });
        });

        it('fetches an author by slug', function () {
            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    search_by: 'slug',
                    slug: 'ghost'
                }
            });

            apiMock.get('/ghost/api/v2/admin/users/slug/ghost/')
                .reply(200, {
                    users: [{
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
                    }]
                });

            return appTester(App.searches.author.operation.perform, bundle)
                .then((results) => {
                    apiMock.isDone().should.be.true;
                    results.length.should.eql(1);

                    let [firstAuthor] = results;
                    firstAuthor.id.should.eql('5951f5fca366002ebd5dbef7');
                    firstAuthor.name.should.eql('Ghost');
                    firstAuthor.email.should.eql('ghost-author@example.com');
                    firstAuthor.slug.should.eql('ghost');
                });
        });

        it('handles a 404', function () {
            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    search_by: 'email',
                    email: 'unknown@example.com'
                }
            });

            apiMock.get('/ghost/api/v2/admin/users/email/unknown@example.com/')
                .reply(404, {
                    errors: [{
                        message: 'Resource not found error, cannot read user.',
                        context: 'User not found.',
                        type: 'NotFoundError',
                        details: null,
                        property: null,
                        help: null,
                        code: null,
                        id: 'f4d2c030-5165-11e9-9864-f79cf99013d0'
                    }]
                });

            return appTester(App.searches.author.operation.perform, bundle)
                .then((results) => {
                    apiMock.isDone().should.be.true;
                    results.length.should.eql(0);
                });
        });

        it('handles a validation error', function () {
            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    search_by: 'email',
                    email: 'unknown'
                }
            });

            apiMock.get('/ghost/api/v2/admin/users/email/unknown/')
                .reply(422, {
                    errors: [{
                        message: 'Validation error, cannot read user.',
                        context: 'Validation (isEmail) failed for email',
                        type: 'ValidationError',
                        details: null,
                        property: null,
                        help: null,
                        code: null,
                        id: 'fb5a30d0-517b-11e9-9864-f79cf99013d0'
                    }]
                });

            return appTester(App.searches.author.operation.perform, bundle)
                .then(() => {
                    true.should.eql(false);
                }, (err) => {
                    err.name.should.eql('HaltedError');
                    err.message.should.match(/Validation \(isEmail\)/i);
                });
        });
    });
});
