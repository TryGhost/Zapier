const nock = require('nock');
const should = require('should');

const zapier = require('zapier-platform-core');

// Use this to make test calls into your app:
const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('Authentication', () => {
    let apiMock = nock('http://zapier-test.ghost.io');
    let authData = {
        adminUrl: 'http://zapier-test.ghost.io/ghost/',
        email: 'test@ghost.org',
        password: 'iamsupersecure'
    };

    afterEach(() => {
        nock.cleanAll();
    });

    it('gets config and exchanges user/pass for auth token', (done) => {
        let bundle = Object.assign({}, {authData});

        apiMock.get('/ghost/api/v0.1/configuration/')
            .reply(200, {
                configuration: [{
                    blogTitle: 'Test Blog',
                    clientId: 'test-client-id',
                    clientSecret: 'test-client-secret'
                }]
            })

        apiMock.post('/ghost/api/v0.1/authentication/token', {
                grant_type: 'password',
                username: 'test@ghost.org',
                password: 'iamsupersecure',
                client_id: 'test-client-id',
                client_secret: 'test-client-secret'
            })
            .reply(200, {
                access_token: 'new auth token!'
            });

        appTester(App.authentication.sessionConfig.perform, bundle)
            .then((newAuthData) => {
                apiMock.isDone().should.be.true;
                newAuthData.token.should.eql('new auth token!');
                done();
            })
            .catch(done);
    });

    it('adds authorization header to every request', (done) => {
        let bundle = Object.assign({}, {authData});

        bundle.authData.token = 'my-auth-token';

        apiMock.get('/ghost/api/v0.1/users/me/');

        appTester(App.authentication.test, bundle)
            .then((response) => {
                apiMock.isDone().should.be.true;
                response.status.should.eql(200);
                response.request.headers['Authorization'].should.eql('Bearer my-auth-token');
                done();
            })
            .catch(done);
    });

    it('throws auth refresh error if response is 401', (done) => {
        let bundle = Object.assign({}, {authData});
        bundle.authData.token = 'my-expired-token';

        apiMock.get('/ghost/api/v0.1/users/me/')
            .reply(401);

        appTester(App.authentication.test, bundle)
            .then(() => {
                true.should.eql(false);
            })
            .catch((err) => {
                err.name.should.eql('RefreshAuthError');
            })
            .finally(done);
    });

    it('handles 404 from configuration URL', (done) => {
        let bundle = Object.assign({}, {authData});

        apiMock.get('/ghost/api/v0.1/configuration/')
            .reply(404);

        appTester(App.authentication.sessionConfig.perform, bundle)
            .then(() => {
                true.should.eql(false);
            })
            .catch((err) => {
                err.message.should.startWith('Unable to fetch blog config');
            })
            .finally(done);
    });

    describe('errors', function () {
        let bundle = Object.assign({}, {authData});

        beforeEach(() => {
            apiMock.get('/ghost/api/v0.1/configuration/')
                .reply(200, {
                    configuration: [{
                        blogTitle: 'Test Blog',
                        clientId: 'test-client-id',
                        clientSecret: 'test-client-secret'
                    }]
                });
        });

        it('handles unknown email', (done) => {
            apiMock.post('/ghost/api/v0.1/authentication/token')
                .reply(404, {
                    errors: [{
                        message: 'There is no user with that email address.',
                        errorType: 'NotFoundError'
                    }]
                });

            appTester(App.authentication.sessionConfig.perform, bundle)
                .then(() => {
                    true.should.eql(false);
                })
                .catch((err) => {
                    err.message.should.startWith('There is no user with that email address.');
                })
                .finally(done);
        });

        it('handles incorrect password', (done) => {
            apiMock.post('/ghost/api/v0.1/authentication/token')
                .reply(422, {
                    errors: [{
                        message: 'Your password is incorrect.',
                        errorType: 'ValidationError'
                    }]
                });

            appTester(App.authentication.sessionConfig.perform, bundle)
                .then(() => {
                    true.should.eql(false);
                })
                .catch((err) => {
                    err.message.should.startWith('Your password is incorrect.');
                })
                .finally(done);
        });

        it('handles brute force error', (done) => {
            apiMock.post('/ghost/api/v0.1/authentication/token')
                .reply(429, {
                    errors: [{
                        message: 'Too many sign-in attempts try again in 10 minutes',
                        errorType: 'TooManyRequestsError'
                    }]
                });

            appTester(App.authentication.sessionConfig.perform, bundle)
                .then(() => {
                    true.should.eql(false);
                })
                .catch((err) => {
                    err.message.should.startWith('Too many sign-in attempts try again in 10 minutes');
                })
                .finally(done);
        });

        it('handles unexpected errors', (done) => {
            apiMock.post('/ghost/api/v0.1/authentication/token')
                .reply(500);

            appTester(App.authentication.sessionConfig.perform, bundle)
                .then(() => {
                    true.should.eql(false);
                })
                .catch((err) => {
                    err.message.should.startWith('Authentication failed. Received status code 500');
                })
                .finally(done);
        });

        it('handles unexpected response data', (done) => {
            apiMock.post('/ghost/api/v0.1/authentication/token')
                .reply(200, 'What is this?');

            appTester(App.authentication.sessionConfig.perform, bundle)
                .then(() => {
                    true.should.eql(false);
                })
                .catch((err) => {
                    err.message.should.startWith('Authentication failed. Unexpected response');
                })
                .finally(done);
        });
    });
});
