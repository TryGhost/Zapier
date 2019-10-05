require('should');
const nock = require('nock');

const zapier = require('zapier-platform-core');

// Use this to make test calls into your app:
const App = require('../../index');
const appTester = zapier.createAppTester(App);

describe('Creates', function () {
    describe('Create Member', function () {
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

        it('creates a member', function () {
            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    name: 'Test Member',
                    email: 'test@example.com',
                    send_email: 'no',
                    email_type: 'signup'
                }
            });

            apiMock.post('/ghost/api/v2/admin/members/?send_email=false&email_type=signup', {
                members: [{
                    name: 'Test Member',
                    email: 'test@example.com'
                }]
            }).reply(201, {
                members: [{
                    id: '5c9c9c8d51b5bf974afad2a4',
                    name: 'Test Member',
                    email: 'test@example.com',
                    created_at: '2019-10-03T11:54:10.123Z',
                    updated_at: '2019-10-03T11:54:10.123Z'
                }]
            });

            return appTester(App.creates.create_member.operation.perform, bundle)
                .then((member) => {
                    apiMock.isDone().should.be.true;

                    member.id.should.equal('5c9c9c8d51b5bf974afad2a4');
                    member.name.should.equal('Test Member');
                    member.email.should.equal('test@example.com');
                });
        });

        it('has a friendly, halting "unsupported version" error', function () {
            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    name: 'Test Member',
                    email: 'test@example.com'
                }
            });

            apiMock.post('/ghost/api/v2/admin/members/', {
                members: [{
                    name: 'Test Member',
                    email: 'test@example.com'
                }]
            }).reply(404, {
                errors: [{
                    message: 'Resource not found',
                    context: null,
                    type: 'NotFoundError',
                    details: null,
                    property: null,
                    help: null,
                    code: null,
                    id: 'bfd6e8e0-e5d8-11e9-9c93-7f00c0c290d4'
                }]
            });

            return appTester(App.creates.create_member.operation.perform, bundle)
                .then(() => {
                    true.should.equal(false);
                }, (err) => {
                    err.name.should.eql('HaltedError');
                    err.message.should.match(/2\.32\.0/);
                });
        });

        it('has a friendly, halting validation error', function () {
            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    name: 'Test Member'
                }
            });

            apiMock.post('/ghost/api/v2/admin/members/', {
                members: [{
                    name: 'Test Member'
                }]
            }).reply(422, {
                errors: [{
                    message: 'Validation error, cannot save subscriber.',
                    context: 'Validation (isEmail) failed for email',
                    type: 'ValidationError',
                    details: null,
                    property: null,
                    help: null,
                    code: null,
                    id: '2749ebe0-5145-11e9-9864-f79cf99013d0'
                }]
            });

            return appTester(App.creates.create_member.operation.perform, bundle)
                .then(() => {
                    true.should.equal(false);
                }, (err) => {
                    err.name.should.eql('HaltedError');
                    err.message.should.match(/Validation \(isEmail\) failed for email/);
                });
        });

        it('handles 500 errors with JSON error body', function () {
            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    name: 'Test Member',
                    email: 'test@example.com'
                }
            });

            apiMock.post('/ghost/api/v2/admin/members/')
                .reply(500, {
                    errors: [{
                        message: 'Authorization failed',
                        context: 'Unable to determine the authenticated user or integration. Check that cookies are being passed through if using session authentication.',
                        type: 'NoPermissionError',
                        details: null,
                        property: null,
                        help: null,
                        code: null,
                        id: '34950f70-5148-11e9-9864-f79cf99013d0'
                    }]
                });

            return appTester(App.creates.create_member.operation.perform, bundle)
                .then(() => {
                    true.should.eql(false);
                }, (err) => {
                    err.name.should.eql('RequestError');
                    err.message.should.match(/Authorization failed/);
                });
        });
    });
});
