const nock = require('nock');
const should = require('should');

const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);

describe('Creates', () => {
    describe('Create Subscriber', () => {
        let apiMock = nock('http://zapier-test.ghost.io');
        let authData = {
            adminUrl: 'http://zapier-test.ghost.io/ghost/',
            email: 'test@ghost.org',
            password: 'iamsupersecure'
        };

        afterEach(() => {
            nock.cleanAll();
        });

        it('creates a susbcriber', (done) => {
            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    name: 'Test User',
                    email: 'test@example.com'
                }
            });

            apiMock.post('/ghost/api/v0.1/subscribers/', {
                subscribers: [{
                    name: 'Test User',
                    email: 'test@example.com'
                }]
            }).reply(201, {
                subscribers: [{
                    id: 'one',
                    name: 'Test User',
                    email: 'test@example.com'
                }]
            });

            appTester(App.creates.create_subscriber.operation.perform, bundle)
                .then((result) => {
                    apiMock.isDone().should.be.true;

                    result.id.should.eql('one');
                    result.name.should.eql('Test User');
                    result.email.should.eql('test@example.com');
                    done();
                })
                .catch(done);
        });

        it('has a friendlier, halting validation error', (done) => {
            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    name: 'Test User',
                    email: 'notanemail'
                }
            });

            apiMock.post('/ghost/api/v0.1/subscribers/', {
                subscribers: [{
                    name: 'Test User',
                    email: 'notanemail'
                }]
            }).reply(422, {
                errors: [{
                    message: 'Validation (isEmail) failed for email'
                }]
            });

            appTester(App.creates.create_subscriber.operation.perform, bundle)
                .then(() => {
                    true.should.eql(false);
                })
                .catch((err) => {
                    err.name.should.eql('HaltedError');
                    err.message.should.match(/"notanemail" is not a valid email address\./);
                })
                .finally(done);
        });

        it('handles errors with JSON error body', (done) => {
            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    name: 'Test User',
                    email: 'test@example.com'
                }
            });

            apiMock.post('/ghost/api/v0.1/subscribers/', {
                subscribers: [{
                    name: 'Test User',
                    email: 'test@example.com'
                }]
            }).reply(500, {
                errors: [{
                    message: 'No permission'
                }]
            });

            appTester(App.creates.create_subscriber.operation.perform, bundle)
                .then(() => {
                    true.should.eql(false);
                })
                .catch((err) => {
                    err.name.should.eql('Error');
                    err.message.should.match(/No permission/);
                })
                .finally(done);
        });

        it('handles unknown errors', (done) => {
            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    name: 'Test User',
                    email: 'test@example.com'
                }
            });

            apiMock.post('/ghost/api/v0.1/subscribers/', {
                subscribers: [{
                    name: 'Test User',
                    email: 'test@example.com'
                }]
            }).reply(500, '');

            appTester(App.creates.create_subscriber.operation.perform, bundle)
                .then(() => {
                    true.should.eql(false);
                })
                .catch((err) => {
                    err.name.should.eql('Error');
                    err.message.should.match(/Unknown Error: 500/);
                })
                .finally(done);
        });

        it('handles invalid JSON', (done) => {
            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    name: 'Test User',
                    email: 'test@example.com'
                }
            });

            apiMock.post('/ghost/api/v0.1/subscribers/', {
                subscribers: [{
                    name: 'Test User',
                    email: 'test@example.com'
                }]
            }).reply(201, 'Not JSON');

            appTester(App.creates.create_subscriber.operation.perform, bundle)
                .then(() => {
                    true.should.eql(false);
                })
                .catch((err) => {
                    err.name.should.eql('Error');
                    err.message.should.match(/Response was not JSON/);
                })
                .finally(done);
        });
    });
});
