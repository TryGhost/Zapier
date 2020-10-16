require('should');
const nock = require('nock');

const zapier = require('zapier-platform-core');

// Use this to make test calls into your app:
const App = require('../../index');
const appTester = zapier.createAppTester(App);

describe('Searches', function () {
    describe('Member', function () {
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

        it('fetches a member by email', function () {
            apiMock.get('/ghost/api/v2/admin/site/').reply(200, {
                site: {version: '3.18.0'}
            });

            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    email: 'ghost-member@example.com'
                }
            });

            apiMock.get('/ghost/api/v3/admin/members/?search=ghost-member%40example.com')
                .reply(200, {
                    members: [{
                        id: '5951f5fca366002ebd5dbef7',
                        name: 'Ghost',
                        email: 'ghost-member@example.com'
                    }]
                });

            return appTester(App.searches.member.operation.perform, bundle)
                .then((results) => {
                    apiMock.isDone().should.be.true;
                    results.length.should.eql(1);

                    let [member] = results;
                    member.id.should.eql('5951f5fca366002ebd5dbef7');
                    member.name.should.eql('Ghost');
                    member.email.should.eql('ghost-member@example.com');
                });
        });

        describe('with unsupported version', function () {
            beforeEach(function () {
                apiMock.get('/ghost/api/v2/admin/site/').reply(200, {
                    site: {version: '2.34'}
                });
            });

            it('shows unsupported error for list', function () {
                let bundle = Object.assign({}, {authData});

                return appTester(App.searches.member.operation.perform, bundle)
                    .then(() => {
                        true.should.equal(false);
                    }, (err) => {
                        err.name.should.equal('HaltedError');
                        err.message.should.match(/does not support member search. Supported version range is >=3.18.0, you are using 2.34/);
                    });
            });
        });
    });
});
