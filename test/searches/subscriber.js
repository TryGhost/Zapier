const nock = require('nock');
const should = require('should');

const zapier = require('zapier-platform-core');

// Use this to make test calls into your app:
const App = require('../../index');
const appTester = zapier.createAppTester(App);

describe('Searches', () => {
    describe('Subscriber', () => {
        let apiMock = nock('http://zapier-test.ghost.io');
        let authData = {
            adminUrl: 'http://zapier-test.ghost.io/ghost/',
            email: 'test@ghost.org',
            password: 'iamsupersecure'
        };

        afterEach(() => {
            nock.cleanAll();
        });

        it('fetches a subscriber by email', (done) => {
            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    email: 'test@example.com'
                }
            });

            apiMock.get('/ghost/api/v0.1/subscribers/email/test@example.com/')
                .reply(200, {
                    subscribers: [{
                        id: '5a01d3ecc8d50d0e606a7e7c',
                        name: 'Test Subscriber',
                        email: 'test@example.com'
                    }]
                });

            appTester(App.searches.subscriber.operation.perform, bundle)
                .then((results) => {
                    apiMock.isDone().should.be.true;
                    results.length.should.eql(1);

                    let [firstSubscriber] = results;
                    firstSubscriber.id.should.eql('5a01d3ecc8d50d0e606a7e7c');
                    firstSubscriber.name.should.eql('Test Subscriber');
                    firstSubscriber.email.should.eql('test@example.com');

                    done();
                })
                .catch(done);
        });

        it('handles empty response', (done) => {
            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    email: 'test@example.com'
                }
            });

            apiMock.get('/ghost/api/v0.1/subscribers/email/test@example.com/')
                .reply(200, {
                    subscribers: []
                });

            appTester(App.searches.subscriber.operation.perform, bundle)
                .then((results) => {
                    apiMock.isDone().should.be.true;
                    results.length.should.eql(0);
                    done();
                })
                .catch(done);
        });
    });
});
