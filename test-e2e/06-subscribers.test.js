// Runs against a real Ghost instance - see test-e2e/setup/bootstrap.js
// Subscribers were removed in Ghost 3.0, so against a modern Ghost every
// deprecated subscriber operation must halt with a version-gate error.
require('should');

const {App, appTester, getAuthData, shouldHalt, fixtures} = require('./helpers');

const VERSION_GATE = /does not support subscribers/;

describe('E2E Deprecated subscriber operations', function () {
    let authData;

    before(function () {
        authData = getAuthData();
    });

    it('create_subscriber halts with a version-gate error', async function () {
        await shouldHalt(appTester(App.creates.create_subscriber.operation.perform, {
            authData,
            inputData: {email: fixtures.member.email}
        }), VERSION_GATE);
    });

    it('delete_subscriber halts with a version-gate error', async function () {
        await shouldHalt(appTester(App.creates.delete_subscriber.operation.perform, {
            authData,
            inputData: {email: fixtures.member.email}
        }), VERSION_GATE);
    });

    it('subscriber search halts with a version-gate error', async function () {
        await shouldHalt(appTester(App.searches.subscriber.operation.perform, {
            authData,
            inputData: {email: fixtures.member.email}
        }), VERSION_GATE);
    });

    it('subscriber_created performList halts with a version-gate error', async function () {
        await shouldHalt(appTester(App.triggers.subscriber_created.operation.performList, {
            authData
        }), VERSION_GATE);
    });

    it('subscriber_created performSubscribe halts with a version-gate error', async function () {
        await shouldHalt(appTester(App.triggers.subscriber_created.operation.performSubscribe, {
            authData,
            targetUrl: 'http://example.com/hook/subscriber_created'
        }), VERSION_GATE);
    });

    it('subscriber_created performUnsubscribe halts with a version-gate error', async function () {
        await shouldHalt(appTester(App.triggers.subscriber_created.operation.performUnsubscribe, {
            authData,
            subscribeData: {id: '5c9c9c8d51b5bf974afad2a4'}
        }), VERSION_GATE);
    });

    it('subscriber_deleted performList halts with a version-gate error', async function () {
        await shouldHalt(appTester(App.triggers.subscriber_deleted.operation.performList, {
            authData
        }), VERSION_GATE);
    });
});
