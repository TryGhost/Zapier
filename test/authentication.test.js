require('should');
const nock = require('nock');
const zapier = require('zapier-platform-core');

// Use this to make test calls into your app:
const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('Authentication', () => {
    let apiMock = nock('http://zapier-test.ghost.io');
    let authData = {
        adminApiUrl: 'http://zapier-test.ghost.io',
        adminApiKey: '5c3e1182e79eace7f58c9c3b:7202e874ccae6f1ee6688bb700f356b672fb078d8465860852652037f7c7459ddbd2f2a6e9aa05a40b499ae20027d9f9ba2e5004aa9ab6510b90a5dac674cbc1'
    };

    afterEach(() => {
        nock.cleanAll();
    });

    describe('test', () => {
        it('is success with valid api key and Ghost version', function () {
            let bundle = Object.assign({}, {authData});

            apiMock.get('/ghost/api/v2/admin/site/')
                .reply(200, {
                    site: {version: '2.19'}
                });

            return appTester(App.authentication.test, bundle)
                .then(() => {
                    nock.pendingMocks().length.should.eql(0);
                });
        });

        it('errors with invalid Admin API Key', function () {
            let bundle = Object.assign({}, {authData});

            apiMock.get('/ghost/api/v2/admin/site/')
                .reply(400, {
                    errors: [{
                        message: 'Invalid token',
                        code: 'INVALID_JWT'
                    }]
                });

            return appTester(App.authentication.test, bundle)
                .then(() => {
                    true.should.eql(false);
                }, (err) => {
                    err.message.should.match(/^Invalid token/);
                    nock.pendingMocks().length.should.eql(0);
                });
        });

        it('errors with invalid Ghost v2 version', function () {
            let bundle = Object.assign({}, {authData});

            apiMock.get('/ghost/api/v2/admin/site/')
                .reply(200, {
                    site: {version: '2.10'}
                });

            return appTester(App.authentication.test, bundle)
                .then(() => {
                    true.should.eql(false);
                }, (err) => {
                    err.message.should.match(/^Supported Ghost version/);
                    err.message.should.match(/you are using 2\.10/);
                    nock.pendingMocks().length.should.eql(0);
                });
        });

        it('errors with non-v2 Ghost version', function () {
            let bundle = Object.assign({}, {authData});

            apiMock.get('/ghost/api/v2/admin/site/')
                .reply(404);

            apiMock.get('/ghost/api/v0.1/configuration/about/')
                .reply(401);

            return appTester(App.authentication.test, bundle)
                .then(() => {
                    true.should.eql(false);
                }, (err) => {
                    // nock.pendingMocks().length.should.eql(0);
                    err.message.should.match(/^Supported Ghost version/);
                });
        });

        it('errors with non-Ghost site', function () {
            let bundle = Object.assign({}, {authData});

            apiMock.get('/ghost/api/v2/admin/site/')
                .reply(404);

            apiMock.get('/ghost/api/v0.1/configuration/about/')
                .reply(404);

            return appTester(App.authentication.test, bundle)
                .then(() => {
                    true.should.eql(false);
                }, (err) => {
                    // nock.pendingMocks().length.should.eql(0);
                    err.message.should.match(/^Supplied 'Admin API URL' does not/);
                });
        });
    });
});
