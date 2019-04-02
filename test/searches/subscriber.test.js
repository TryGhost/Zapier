require('should');
const nock = require('nock');

const zapier = require('zapier-platform-core');

// Use this to make test calls into your app:
const App = require('../../index');
const appTester = zapier.createAppTester(App);

describe('Searches', () => {
    describe('Subscriber', () => {
        let apiMock = nock('https://zapier-test.ghost.io');
        let authData = {
            adminApiUrl: 'https://zapier-test.ghost.io',
            adminApiKey: '5c3e1182e79eace7f58c9c3b:7202e874ccae6f1ee6688bb700f356b672fb078d8465860852652037f7c7459ddbd2f2a6e9aa05a40b499ae20027d9f9ba2e5004aa9ab6510b90a5dac674cbc1'
        };

        afterEach(() => {
            nock.cleanAll();
        });

        it('fetches a subscriber by email', () => {
            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    email: 'test@example.com'
                }
            });

            apiMock.get('/ghost/api/v2/admin/subscribers/email/test@example.com/')
                .reply(200, {
                    subscribers: [{
                        email: 'test@example.com',
                        id: '5c9cd98a51b5bf974afad2a6',
                        name: 'Test Subscriber',
                        status: 'subscribed',
                        post_id: null,
                        subscribed_url: null,
                        subscribed_referrer: null,
                        unsubscribed_url: null,
                        unsubscribed_at: null,
                        created_at: '2019-03-28T14:26:18.000Z',
                        updated_at: '2019-03-28T14:26:18.000Z'
                    }]
                });

            return appTester(App.searches.subscriber.operation.perform, bundle)
                .then((results) => {
                    apiMock.isDone().should.be.true;
                    results.length.should.eql(1);

                    let [firstSubscriber] = results;
                    firstSubscriber.id.should.eql('5c9cd98a51b5bf974afad2a6');
                    firstSubscriber.name.should.eql('Test Subscriber');
                    firstSubscriber.email.should.eql('test@example.com');
                });
        });

        it('handles a 404', () => {
            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    email: 'unknown@example.com'
                }
            });

            apiMock.get('/ghost/api/v2/admin/subscribers/email/unknown@example.com/')
                .reply(404, {
                    errors: [{
                        message: 'Resource not found error, cannot read subscriber.',
                        context: 'Subscriber not found.',
                        type: 'NotFoundError',
                        details: null,
                        property: null,
                        help: null,
                        code: null,
                        id: 'f4d2c030-5165-11e9-9864-f79cf99013d0'
                    }]
                });

            return appTester(App.searches.subscriber.operation.perform, bundle)
                .then((results) => {
                    apiMock.isDone().should.be.true;
                    results.length.should.eql(0);
                });
        });

        it('handles a validation error', () => {
            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    email: 'unknown'
                }
            });

            apiMock.get('/ghost/api/v2/admin/subscribers/email/unknown/')
                .reply(422, {
                    errors: [{
                        message: 'Validation error, cannot read subscriber.',
                        context: 'Validation (isEmail) failed for email',
                        type: 'ValidationError',
                        details: null,
                        property: null,
                        help: null,
                        code: null,
                        id: 'fb5a30d0-517b-11e9-9864-f79cf99013d0'
                    }]
                });

            return appTester(App.searches.subscriber.operation.perform, bundle)
                .then(() => {
                    true.should.eql(false);
                }, (err) => {
                    err.name.should.eql('HaltedError');
                    err.message.should.match(/Validation \(isEmail\)/i);
                });
        });
    });
});
