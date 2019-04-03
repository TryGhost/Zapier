const _ = require('lodash');
const {initAdminApi} = require('../lib/utils');
const webhooks = require('../lib/webhooks');

const subscribeWebhook = _.partial(webhooks.subscribe, 'subscriber.added');
const unsubscribeWebhook = webhooks.unsubscribe;

// triggers on subscriber.added. Formats the API response ready for passing to
// the zap which expects an array
const handleWebhook = (z, bundle) => {
    // bundle.cleanedRequest will include the parsed JSON object (if it's not a
    // test poll) and also a .querystring property with the URL's query string.
    const {subscriber} = bundle.cleanedRequest;

    return [subscriber.current];
};

const getLatestSubscriber = (z, bundle) => {
    const api = initAdminApi(z, bundle.authData);

    return api.subscribers.browse({
        order: 'created_at DESC',
        limit: 1
    });
};

module.exports = {
    key: 'subscriber_created',
    noun: 'Subscriber',

    display: {
        label: 'Subscriber Created',
        description: 'Triggers when a new subscriber is added.'
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
        performList: getLatestSubscriber,

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
