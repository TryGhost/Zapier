const {initAdminApi, versionCheck} = require('../lib/utils');
const webhooks = require('../lib/webhooks');

const subscribeWebhook = async (z, bundle) => {
    // Ghost 3.0 removes all subscriber routes, show an unsupported error
    await versionCheck('<3.0.0', 'subscribers', z, bundle);

    return webhooks.subscribe('subscriber.deleted', z, bundle);
};

const unsubscribeWebhook = async (z, bundle) => {
    // Ghost 3.0 removes all subscriber routes, show an unsupported error
    await versionCheck('<3.0.0', 'subscribers', z, bundle);

    return webhooks.unsubscribe(z, bundle);
};

// triggers on subscriber.added. Formats the API response ready for passing to
// the zap which expects an array
const handleWebhook = (z, bundle) => {
    // bundle.cleanedRequest will include the parsed JSON object (if it's not a
    // test poll) and also a .querystring property with the URL's query string.
    const {subscriber} = bundle.cleanedRequest;

    return [subscriber.previous];
};

const getLatestUnsubscriber = async (z, bundle) => {
    // Ghost 3.0 removes all subscriber routes, show an unsupported error
    await versionCheck('<3.0.0', 'subscribers', z, bundle);

    const api = initAdminApi(z, bundle.authData);

    return api.subscribers
        .browse({order: 'created_at DESC', limit: 1});
};

module.exports = {
    key: 'subscriber_deleted',
    noun: 'Subscriber',

    display: {
        label: 'Subscriber Deleted (Deprecated)',
        description: 'Triggers when a subscriber is deleted (Subscribers feature is deprecated and is replaced by [members](https://ghost.org/docs/members/zapier/) in Ghost 3.0 or later).'
    },

    operation: {
        // we don't need any input from the user for this trigger
        inputFields: [
        ],

        // use resthooks rather than polling
        type: 'hook',

        performSubscribe: subscribeWebhook,
        performUnsubscribe: unsubscribeWebhook,

        perform: handleWebhook,
        performList: getLatestUnsubscriber,

        sample: {
            id: '5a01d3ecc8d50d0e606a7e7c',
            name: 'Test Subscriber',
            email: 'test@example.com',
            status: 'subscribed',
            post_id: null,
            subscribed_url: null,
            subscribed_referrer: null,
            unsubscribed_url: null,
            created_at: '2019-03-22T08:39:02.890Z',
            updated_at: '2019-03-22T08:39:02.890Z',
            unsubscribed_at: null
        }
    }
};
