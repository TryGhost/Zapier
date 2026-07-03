// Runs against a real Ghost instance - see test-e2e/setup/bootstrap.js
import {describe, it, expect, beforeAll} from 'vitest';

import {App, appTester, getAuthData} from './helpers';

// every hook trigger that can subscribe against a modern Ghost - the
// deprecated subscriber_* triggers are covered in 06-subscribers.test.js
const HOOK_TRIGGERS = [
    'post_published',
    'post_scheduled',
    'page_published',
    'tag_created',
    'author_created',
    'member_created',
    'member_updated',
    'member_deleted',
    'newsletter_created'
];

HOOK_TRIGGERS.forEach(function (triggerKey) {
    describe(`E2E Webhook subscription: ${triggerKey}`, function () {
        let authData;

        beforeAll(function () {
            authData = getAuthData();
        });

        it('completes a subscribe/unsubscribe round-trip', async function () {
            const {operation} = App.triggers[triggerKey];

            const subscribeData = await appTester(operation.performSubscribe, {
                authData,
                targetUrl: `http://example.com/hook/${triggerKey}`
            });

            expect(subscribeData.id).toBeTypeOf('string');

            // a failed DELETE would reject and fail the test
            await appTester(operation.performUnsubscribe, {
                authData,
                subscribeData
            });
        });
    });
});
