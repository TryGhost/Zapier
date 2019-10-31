require('should');
const nock = require('nock');

const zapier = require('zapier-platform-core');

// Use this to make test calls into your app:
const App = require('../../index');
const appTester = zapier.createAppTester(App);

describe('Triggers', function () {
    describe('Member Deleted', function () {
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
                    site: {version: '3.1'}
                });
            });

            it('loads member from fake hook', function () {
                let bundle = Object.assign({}, {authData}, {
                    inputData: {},
                    cleanedRequest: {
                        member: {
                            current: {},
                            previous: {
                                id: '5c9a1929da323575684e5786',
                                name: 'Test Member',
                                email: 'test@example.com',
                                note: 'A test member',
                                created_at: '2019-03-26T12:20:57.000Z',
                                updated_at: '2019-03-26T12:20:57.000Z'
                            }
                        }
                    }
                });

                return appTester(App.triggers.member_deleted.operation.perform, bundle)
                    .then(([member]) => {
                        member.id.should.eql('5c9a1929da323575684e5786');
                        member.name.should.eql('Test Member');
                        member.email.should.eql('test@example.com');
                    });
            });

            it('loads member from list', function () {
                let bundle = Object.assign({}, {authData}, {
                    inputData: {},
                    meta: {
                        frontend: true
                    }
                });

                apiMock.get('/ghost/api/v3/admin/members/')
                    .query({
                        order: 'created_at DESC',
                        limit: 1
                    })
                    .reply(200, {
                        members: [{
                            id: 'one',
                            name: 'Member One',
                            email: 'one@example.com',
                            post_id: '5a1d8648a629fc69c2706d29',
                            status: 'A test member',
                            updated_at: '2017-12-13T16:33:24.000Z',
                            updated_by: '5a315654eddbd3ce4c0cd92c'
                        }],
                        meta: {
                            pagination: {
                                page: 1,
                                limit: 1,
                                pages: 1,
                                total: 1,
                                next: null,
                                prev: null
                            }
                        }
                    });

                return appTester(App.triggers.member_deleted.operation.performList, bundle)
                    .then((results) => {
                        apiMock.isDone().should.be.true;
                        results.length.should.eql(1);

                        let [firstMember] = results;
                        firstMember.id.should.eql('one');
                        firstMember.name.should.eql('Member One');
                        firstMember.email.should.eql('one@example.com');
                    });
            });

            it('subscribes to webhook', function () {
                let bundle = Object.assign({}, {authData}, {
                    targetUrl: 'https://webooks.zapier.com/ghost/member'
                });

                apiMock
                    .post('/ghost/api/v2/admin/webhooks/', {
                        webhooks: [{
                            integration_id: '5c3e1182e79eace7f58c9c3b',
                            target_url: 'https://webooks.zapier.com/ghost/member',
                            event: 'member.deleted'
                        }]
                    })
                    .reply(201, {
                        webhooks: [{
                            id: 'subscribe-test',
                            target_url: 'https://webooks.zapier.com/ghost/member',
                            event: 'member.deleted'
                        }]
                    });

                return appTester(App.triggers.member_deleted.operation.performSubscribe, bundle)
                    .then(() => {
                        apiMock.isDone().should.be.true;
                    });
            });

            it('unsubscribes from webhook', function () {
                let bundle = Object.assign({}, {authData}, {
                    subscribeData: {
                        id: 'subscribe-test',
                        target_url: 'https://webooks.zapier.com/ghost/member',
                        event: 'member.deleted'
                    }
                });

                apiMock
                    .delete('/ghost/api/v2/admin/webhooks/subscribe-test/')
                    .reply(204);

                return appTester(App.triggers.member_deleted.operation.performUnsubscribe, bundle)
                    .then(() => {
                        apiMock.isDone().should.be.true;
                    });
            });
        });

        describe('with unsupported version', function () {
            beforeEach(function () {
                apiMock.get('/ghost/api/v2/admin/site/').reply(200, {
                    site: {version: '3.0'}
                });
            });

            it('shows unsupported error for list', function () {
                let bundle = Object.assign({}, {authData});

                return appTester(App.triggers.member_deleted.operation.performList, bundle)
                    .then(() => {
                        true.should.equal(false);
                    }, (err) => {
                        err.name.should.equal('HaltedError');
                        err.message.should.match(/does not support members. Supported version range is >=3.1.0, you are using 3.0/);
                    });
            });

            it('shows unsupported error when subscribing', function () {
                let bundle = Object.assign({}, {authData}, {
                    targetUrl: 'https://webooks.zapier.com/ghost/member'
                });

                return appTester(App.triggers.member_deleted.operation.performSubscribe, bundle)
                    .then(() => {
                        true.should.equal(false);
                    }, (err) => {
                        err.name.should.equal('HaltedError');
                        err.message.should.match(/does not support members. Supported version range is >=3.1.0, you are using 3.0/);
                    });
            });

            it('shows unsupported error when unsubscribing', function () {
                let bundle = Object.assign({}, {authData}, {
                    subscribeData: {
                        id: '12345',
                        target_url: 'https://webooks.zapier.com/ghost/member',
                        event: 'member.added'
                    }
                });

                return appTester(App.triggers.member_deleted.operation.performUnsubscribe, bundle)
                    .then(() => {
                        true.should.equal(false);
                    }, (err) => {
                        err.name.should.equal('HaltedError');
                        err.message.should.match(/does not support members. Supported version range is >=3.1.0, you are using 3.0/);
                    });
            });
        });
    });
});
