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
    });
});
