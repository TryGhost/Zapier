const _ = require('lodash');
const hooks = require('../hooks');

const subscribeHook = _.partial(hooks.subscribeHook, 'subscriber.added');
const unsubscribeHook = hooks.unsubscribeHook;

// triggers on new subscriber
const getSubscriber = (z, bundle) => {
    // bundle.cleanedRequest will include the parsed JSON object (if it's not a
    // test poll) and also a .querystring property with the URL's query string.
    let [subscriber] = bundle.cleanedRequest.subscribers;

    return [subscriber];
};

const getFallbackRealSubscriber = (z, bundle) => {
    // For the test poll, you should get some real data, to aid the setup process.
    let options = {
        url: '/subscribers/',
        params: {
            order: 'created_at desc'
        }
    };

    return z.request(options)
        .then((response) => {
            let {subscribers} = JSON.parse(response.content);

            // remove fields that have no relevance for new subscribers
            subscribers.forEach((subscriber) => {
                delete subscriber.unsubscribed_at;
                delete subscriber.unsubscribed_url;
                delete subscriber.updated_at;
                delete subscriber.updated_by;
            });

            return subscribers;
        });
};

module.exports = {
    key: 'new_subscriber',
    noun: 'Subscriber',

    display: {
        label: 'New Subscriber',
        description: 'Triggers when a new subscriber is added.'
    },

    operation: {
        // we don't need any input from the user for this trigger
        inputFields: [
        ],

        // use resthooks rather than polling
        type: 'hook',

        performSubscribe: subscribeHook,
        performUnsubscribe: unsubscribeHook,

        perform: getSubscriber,
        performList: getFallbackRealSubscriber,

        sample: {
            id: '5a01d3ecc8d50d0e606a7e7c',
            name: 'Test Subscriber',
            email: 'test@example.com'
        },

        outputFields: [
            {key: 'id', label: 'ID'},
            {key: 'name', label: 'Name'},
            {key: 'email', label: 'Email'}
        ]
    }
};
