require('should');
const nock = require('nock');

const zapier = require('zapier-platform-core');

// Use this to make test calls into your app:
const App = require('../../index');
const appTester = zapier.createAppTester(App);

describe('Triggers', function () {
    describe('Member Updated', function () {
        let apiMock, authData;

        beforeEach(function () {
            apiMock = nock('http://zapier-test.ghost.io', {
                reqheaders: {
                    'User-Agent': new RegExp(`Zapier\/${App.version} GhostAdminSDK\/\\d+.\\d+.\\d+`)
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
                    site: {version: '3.1'}
                });
            });

            it('loads sample member data', function () {
                let bundle = Object.assign({}, {authData}, {
                    inputData: {},
                    cleanedRequest: {
                        member: {
                            current: {
                                id: '5a01d3ecc8d50d0e606a7e7c',
                                name: 'New Member Name',
                                email: 'sample@example.com',
                                note: 'Updated sample member record.',
                                created_at: '2019-10-13T18:12:00.000Z',
                                updated_at: '2019-10-31T14:58:00.000Z'
                            },
                            previous: {
                                name: 'Old Member Name',
                                note: 'Just a sample member record.',
                                updated_at: '2019-10-13T18:12:00.000Z'
                            }
                        }
                    }
                });

                return appTester(App.triggers.member_updated.operation.perform, bundle)
                    .then(([member]) => {
                        member.current.id.should.eql('5a01d3ecc8d50d0e606a7e7c');
                        member.current.name.should.eql('New Member Name');
                        member.current.email.should.eql('sample@example.com');
                        member.previous.name.should.eql('Old Member Name');
                    });
            });

            it('loads member from list', function () {
                return appTester(App.triggers.member_updated.operation.performList, {authData})
                    .then(([member]) => {
                        should.exist(member.current);
                        Object.keys(member.current).length.should.eql(9);
                        should.exist(member.previous);
                        Object.keys(member.previous).length.should.eql(7);

                        member.current.id.should.eql('5a01d3ecc8d50d0e606a7e7c');

                        member.current.name.should.eql('New Member Name');
                        member.previous.name.should.eql('Old Member Name');

                        member.current.email.should.eql('sample@example.com');
                        member.previous.email.should.eql('oldsample@example.com');

                        member.current.note.should.eql('Updated sample member record.');
                        member.previous.note.should.eql('Old sample member record.');

                        should.exist(member.current.labels);
                        member.current.labels.length.should.equal(2);
                        member.current.labels[0].name.should.eql('Old label 1');
                        member.current.labels[1].name.should.eql('New label');

                        should.exist(member.previous.labels);
                        member.previous.labels.length.should.eql(2);
                        member.previous.labels[0].name.should.eql('Old label 1');
                        member.previous.labels[1].name.should.eql('Old label 2');
                    });
            });

            it('subscribes to webhook', function () {
                let bundle = Object.assign({}, {authData}, {
                    targetUrl: 'https://webooks.zapier.com/ghost/member'
                });

                apiMock.post('/ghost/api/v2/admin/webhooks/', {
                    webhooks: [{
                        integration_id: '5c3e1182e79eace7f58c9c3b',
                        target_url: 'https://webooks.zapier.com/ghost/member',
                        event: 'member.edited'
                    }]
                }).reply(201, {
                    webhooks: [{
                        id: '12345',
                        target_url: 'https://webooks.zapier.com/ghost/member',
                        event: 'member.edited'
                    }]
                });

                return appTester(App.triggers.member_updated.operation.performSubscribe, bundle)
                    .then(() => {
                        apiMock.isDone().should.be.true;
                    });
            });

            it('unsubscribes from webhook', function () {
                let bundle = Object.assign({}, {authData}, {
                    subscribeData: {
                        id: '12345',
                        target_url: 'https://webooks.zapier.com/ghost/member',
                        event: 'member.edited'
                    }
                });

                apiMock.delete('/ghost/api/v2/admin/webhooks/12345/')
                    .reply(204);

                return appTester(App.triggers.member_updated.operation.performUnsubscribe, bundle)
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

                return appTester(App.triggers.member_updated.operation.performList, bundle)
                    .then(() => {
                        true.should.equal(false);
                    }, (err) => {
                        err.name.should.equal('HaltedError');
                        err.message.should.match(/does not support members. Supported version range is >=3.0.3, you are using 3.0/);
                    });
            });

            it('shows unsupported error when subscribing', function () {
                let bundle = Object.assign({}, {authData}, {
                    targetUrl: 'https://webooks.zapier.com/ghost/member'
                });

                return appTester(App.triggers.member_updated.operation.performSubscribe, bundle)
                    .then(() => {
                        true.should.equal(false);
                    }, (err) => {
                        err.name.should.equal('HaltedError');
                        err.message.should.match(/does not support members. Supported version range is >=3.0.3, you are using 3.0/);
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

                return appTester(App.triggers.member_updated.operation.performUnsubscribe, bundle)
                    .then(() => {
                        true.should.equal(false);
                    }, (err) => {
                        err.name.should.equal('HaltedError');
                        err.message.should.match(/does not support members. Supported version range is >=3.0.3, you are using 3.0/);
                    });
            });
        });
    });
});
