const nock = require('nock');
const should = require('should');

const zapier = require('zapier-platform-core');

// Use this to make test calls into your app:
const App = require('../../index');
const appTester = zapier.createAppTester(App);

describe('Triggers', () => {
    describe('New Subscriber', () => {
        let apiMock = nock('http://zapier-test.ghost.io');
        let authData = {
            adminUrl: 'http://zapier-test.ghost.io/ghost/',
            email: 'test@ghost.org',
            password: 'iamsupersecure'
        };

        afterEach(() => {
            nock.cleanAll();
        });

        it('loads subscriber from fake hook', (done) => {
            let bundle = Object.assign({}, {authData}, {
                inputData: {},
                cleanedRequest: {
                    subscribers: [{
                        id: '5a01d3ecc8d50d0e606a7e7c',
                        name: 'Test Subscriber',
                        email: 'test@example.com'
                    }]
                }
            });

            appTester(App.triggers.new_subscriber.operation.perform, bundle)
                .then((results) => {
                    results.length.should.eql(1);

                    let [firstSubscriber] = results;
                    firstSubscriber.id.should.eql('5a01d3ecc8d50d0e606a7e7c');
                    firstSubscriber.name.should.eql('Test Subscriber');
                    firstSubscriber.email.should.eql('test@example.com');

                    done();
                })
                .catch(done);
        });

        it('loads subscriber from list', (done) => {
            let bundle = Object.assign({}, {authData}, {
                inputData: {},
                meta: {
                    frontend: true
                }
            });

            apiMock.get('/ghost/api/v0.1/subscribers/')
                .reply(200, {
                    subscribers: [{
                        id: 'one',
                        name: 'Subscriber One',
                        email: 'one@example.com'
                    }, {
                        id: 'two',
                        name: 'Subscriber Two',
                        email: 'two@example.com'
                    }]
                });

            appTester(App.triggers.new_subscriber.operation.performList, bundle)
                .then((results) => {
                    apiMock.isDone().should.be.true;
                    results.length.should.be.greaterThan(1);

                    let [firstSubscriber] = results;
                    firstSubscriber.id.should.eql('one');
                    firstSubscriber.name.should.eql('Subscriber One');
                    firstSubscriber.email.should.eql('one@example.com');

                    done();
                })
                .catch(done);
        });

        it('subscribes to webhook', (done) => {
            let bundle = Object.assign({}, {authData}, {
                targetUrl: 'https://webooks.zapier.com/ghost/subscriber'
            });

            apiMock.post('/ghost/api/v0.1/webhooks/', {
                webhooks: [{
                    target_url: 'https://webooks.zapier.com/ghost/subscriber',
                    event: 'subscriber.added'
                }]
            }).reply(201, {
                webhooks: [{
                    id: 'subscribe-test',
                    target_url: 'https://webooks.zapier.com/ghost/subscriber',
                    event: 'subscriber.added'
                }]
            });

            appTester(App.triggers.new_subscriber.operation.performSubscribe, bundle)
                .then((results) => {
                    apiMock.isDone().should.be.true;
                    done();
                })
                .catch(done);
        });

        it('unsubscribes from webhook', (done) => {
            let bundle = Object.assign({}, {authData}, {
                subscribeData: {
                    id: 'subscribe-test',
                    target_url: 'https://webooks.zapier.com/ghost/subscriber',
                    event: 'subscriber.added'
                }
            });

            apiMock.delete('/ghost/api/v0.1/webhooks/subscribe-test/')
                .reply(204);

            appTester(App.triggers.new_subscriber.operation.performUnsubscribe, bundle)
                .then((results) => {
                    apiMock.isDone().should.be.true;
                    done();
                })
                .catch(done);
        });
    });
});
