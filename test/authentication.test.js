require('should');
const nock = require('nock');
const zapier = require('zapier-platform-core');

// Use this to make test calls into your app:
const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('Authentication', () => {
    let apiMock = nock('http://zapier-test.ghost.io');
    let authData = {
        adminApiUrl: 'http://zapier-test.ghost.io/ghost/',
        adminApiKey: '5c3e1182e79eace7f58c9c3b:7202e874ccae6f1ee6688bb700f356b672fb078d8465860852652037f7c7459ddbd2f2a6e9aa05a40b499ae20027d9f9ba2e5004aa9ab6510b90a5dac674cbc1'
    };

    afterEach(() => {
        nock.cleanAll();
    });

    describe('test', () => {
        it('is success with valid api key and Ghost version', function (done) {
            let bundle = Object.assign({}, authData);

            apiMock.get('/ghost/api/v2/admin/configuration/about/')
                .reply(200, {
                    configuration: [{version: '2.13.2'}]
                });

            appTester(App.authentication.test, bundle)
                .then(() => {
                    nock.pendingMocks().length.should.eql(0);
                    done();
                })
                .catch(done);
        });

        it('errors with invalid Admin API Key', function (done) {
            let bundle = Object.assign({}, authData);

            apiMock.get('/ghost/api/v2/admin/configuration/about/')
                .reply(400, {
                    errors: [{
                        message: 'Invalid token',
                        code: 'INVALID_JWT'
                    }]
                });

            appTester(App.authentication.test, bundle)
                .then(() => {
                    true.should.eql(false);
                })
                .catch((err) => {
                    console.log(err);
                }).finally(done);
        });

        it('errors with invalid Ghost version', function (done) {
            let bundle = Object.assign({}, authData);

            apiMock.get('/ghost/api/v2/admin/configuration/about/')
                .reply(200, {
                    configuration: [{version: '2.13.2'}]
                });

            appTester(App.authentication.test, bundle)
                .then(() => {
                    nock.pendingMocks().length.should.eql(0);
                    done();
                })
                .catch(done);
        });
    });
});
