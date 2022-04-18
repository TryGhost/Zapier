require('should');
const nock = require('nock');

const zapier = require('zapier-platform-core');

// Use this to make test calls into your app:
const App = require('../../index');
const appTester = zapier.createAppTester(App);

describe('Creates', function () {
    describe('Create Subscriber', function () {
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

            it('creates a subscriber', function () {
                let bundle = Object.assign({}, {authData}, {
                    inputData: {
                        name: 'Test Subscriber',
                        email: 'test@example.com'
                    }
                });

                apiMock.post('/ghost/api/v2/admin/subscribers/', {
                    subscribers: [{
                        name: 'Test Subscriber',
                        email: 'test@example.com'
                    }]
                }).reply(201, {
                    subscribers: [{
                        id: '5c9c9c8d51b5bf974afad2a4',
                        name: 'Test Subscriber',
                        email: 'test@example.com',
                        status: 'subscribed',
                        created_at: '2019-03-28T10:06:05.862Z',
                        updated_at: '2019-03-28T10:06:05.862Z',
                        post_id: null,
                        subscribed_url: null,
                        subscribed_referrer: null,
                        unsubscribed_url: null,
                        unsubscribed_at: null
                    }]
                });

                return appTester(App.creates.create_subscriber.operation.perform, bundle)
                    .then((subscriber) => {
                        apiMock.isDone().should.be.true;

                        subscriber.id.should.eql('5c9c9c8d51b5bf974afad2a4');
                        subscriber.name.should.eql('Test Subscriber');
                        subscriber.email.should.eql('test@example.com');
                    });
            });

            it('has a friendly, halting validation error', function () {
                let bundle = Object.assign({}, {authData}, {
                    inputData: {
                        name: 'Test Subscriber',
                        email: 'notanemail'
                    }
                });

                apiMock.post('/ghost/api/v2/admin/subscribers/')
                    .reply(422, {
                        errors: [{
                            message: 'Validation error, cannot save subscriber.',
                            context: 'Validation (isEmail) failed for email',
                            type: 'ValidationError',
                            details: null,
                            property: null,
                            help: null,
                            code: null,
                            id: '2749ebe0-5145-11e9-9864-f79cf99013d0'
                        }]
                    });

                return appTester(App.creates.create_subscriber.operation.perform, bundle)
                    .then(() => {
                        true.should.eql(false);
                    }, (err) => {
                        err.name.should.eql('HaltedError');
                        err.message.should.match(/Validation \(isEmail\) failed for email/);
                    });
            });

            it('handles 500 errors with JSON error body', function () {
                let bundle = Object.assign({}, {authData}, {
                    inputData: {
                        name: 'Test Subscriber',
                        email: 'test@example.com'
                    }
                });

                apiMock.post('/ghost/api/v2/admin/subscribers/')
                    .reply(500, {
                        errors: [{
                            message: 'Authorization failed',
                            context: 'Unable to determine the authenticated user or integration. Check that cookies are being passed through if using session authentication.',
                            type: 'NoPermissionError',
                            details: null,
                            property: null,
                            help: null,
                            code: null,
                            id: '34950f70-5148-11e9-9864-f79cf99013d0'
                        }]
                    });

                return appTester(App.creates.create_subscriber.operation.perform, bundle)
                    .then(() => {
                        true.should.eql(false);
                    }, (err) => {
                        err.name.should.eql('RequestError');
                        err.message.should.match(/Authorization failed/);
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
                        name: 'Test Subscriber',
                        email: 'test@example.com'
                    }
                });

                return appTester(App.creates.create_subscriber.operation.perform, bundle)
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
