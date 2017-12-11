const nock = require('nock');
const should = require('should');

const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);

describe('Creates', () => {
    describe('Delete Subscriber', () => {
        let apiMock = nock('http://zapier-test.ghost.io');
        let authData = {
            adminUrl: 'http://zapier-test.ghost.io/ghost/',
            email: 'test@ghost.org',
            password: 'iamsupersecure'
        };

        afterEach(() => {
            nock.cleanAll();
        });

        it('deletes a susbcriber', (done) => {
            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    email: 'test@example.com'
                }
            });

            apiMock.delete('/ghost/api/v0.1/subscribers/email/test@example.com/')
                .reply(204);

            appTester(App.creates.delete_subscriber.operation.perform, bundle)
                .then((result) => {
                    apiMock.isDone().should.be.true;
                    result.should.eql({});
                    done();
                })
                .catch(done);
        });

        it('throws halting error for unknown subscriber', (done) => {
            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    email: 'test@example.com'
                }
            });

            apiMock.delete('/ghost/api/v0.1/subscribers/email/test@example.com/')
                .reply(404, {
                    errors: [{
                        message: 'Subscriber not found.'
                    }]
                });

            appTester(App.creates.delete_subscriber.operation.perform, bundle)
                .then(() => {
                    true.should.eql(false);
                })
                .catch((err) => {
                    err.name.should.eql('HaltedError');
                })
                .finally(done);
        });

        it('handles unknown error with JSON response', (done) => {
            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    email: 'test@example.com'
                }
            });

            apiMock.delete('/ghost/api/v0.1/subscribers/email/test@example.com/')
                .reply(500, {
                    errors: [{
                        message: 'No permission.'
                    }]
                });

            appTester(App.creates.delete_subscriber.operation.perform, bundle)
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
                    email: 'test@example.com'
                }
            });

            apiMock.delete('/ghost/api/v0.1/subscribers/email/test@example.com/')
                .reply(502, 'Bad Gateway');

            appTester(App.creates.delete_subscriber.operation.perform, bundle)
                .then(() => {
                    true.should.eql(false);
                })
                .catch((err) => {
                    err.name.should.eql('Error');
                    err.message.should.match(/Unknown Error: 502/);
                })
                .finally(done);
        });
    });
});
