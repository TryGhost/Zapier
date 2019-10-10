require('should');
const nock = require('nock');

const zapier = require('zapier-platform-core');

// Use this to make test calls into your app:
const App = require('../../index');
const appTester = zapier.createAppTester(App);

describe('Creates', function () {
    describe('Delete Subscriber', function () {
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

        describe('with supported version', function () {
            beforeEach(function () {
                apiMock.get('/ghost/api/v2/admin/site/').reply(200, {
                    site: {version: '2.34'}
                });
            });

            it('deletes a subscriber by email', function () {
                let bundle = Object.assign({}, {authData}, {
                    inputData: {
                        email: 'test@example.com'
                    }
                });

                apiMock.delete('/ghost/api/v2/admin/subscribers/email/test@example.com/')
                    .reply(204);

                return appTester(App.creates.delete_subscriber.operation.perform, bundle)
                    .then((result) => {
                        apiMock.isDone().should.be.true;
                        result.should.eql({});
                    });
            });

            it('has a friendly, halting 404 error', function () {
                let bundle = Object.assign({}, {authData}, {
                    inputData: {
                        email: 'unknown@example.com'
                    }
                });

                apiMock.delete('/ghost/api/v2/admin/subscribers/email/unknown@example.com/')
                    .reply(404, {
                        errors: [{
                            message: 'Resource not found error, cannot delete subscriber.',
                            context: 'Subscriber not found.',
                            type: 'NotFoundError',
                            details: null,
                            property: null,
                            help: null,
                            code: null,
                            id: '33a704f0-5153-11e9-9864-f79cf99013d0'
                        }]
                    });

                return appTester(App.creates.delete_subscriber.operation.perform, bundle)
                    .then(() => {
                        true.should.eql(false);
                    }, (err) => {
                        err.name.should.eql('HaltedError');
                        err.message.should.match(/subscriber not found/i);
                    });
            });

            it('has a friendly, halting validation error', function () {
                let bundle = Object.assign({}, {authData}, {
                    inputData: {
                        email: '5c9c9c8d51b5bf974afad2a4'
                    }
                });

                apiMock.delete('/ghost/api/v2/admin/subscribers/email/5c9c9c8d51b5bf974afad2a4/')
                    .reply(422, {
                        errors: [{
                            message: 'Validation error, cannot delete subscriber.',
                            context: 'Validation (isEmail) failed for email',
                            type: 'ValidationError',
                            details: null,
                            property: null,
                            help: null,
                            code: null,
                            id: '83ee51c0-5153-11e9-9864-f79cf99013d0'
                        }]
                    });

                return appTester(App.creates.delete_subscriber.operation.perform, bundle)
                    .then(() => {
                        true.should.eql(false);
                    }, (err) => {
                        err.name.should.eql('HaltedError');
                        err.message.should.match(/validation \(isEmail\) failed for email/i);
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
                        email: 'test@example.com'
                    }
                });

                return appTester(App.creates.delete_subscriber.operation.perform, bundle)
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
