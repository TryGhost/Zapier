require('should');
const nock = require('nock');

const zapier = require('zapier-platform-core');

// Use this to make test calls into your app:
const App = require('../../index');
const appTester = zapier.createAppTester(App);

describe('Creates', () => {
    describe('Create Subscriber', () => {
        let apiMock = nock('https://zapier-test.ghost.io');
        let authData = {
            adminApiUrl: 'https://zapier-test.ghost.io',
            adminApiKey: '5c3e1182e79eace7f58c9c3b:7202e874ccae6f1ee6688bb700f356b672fb078d8465860852652037f7c7459ddbd2f2a6e9aa05a40b499ae20027d9f9ba2e5004aa9ab6510b90a5dac674cbc1'
        };

        afterEach(() => {
            nock.cleanAll();
        });
    });
});
