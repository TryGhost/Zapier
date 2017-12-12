const _ = require('lodash');
const hooks = require('../hooks');

const subscribeHook = _.partial(hooks.subscribeHook, 'subscriber.deleted');
const unsubscribeHook = hooks.unsubscribeHook;

// triggers on deleted subscriber
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
            let cleanedSubscribers = [];

            // Our API only sends {id, name, email} attrs to the
            // subscriber.deleted webhook but we've grabbed a standard browse
            // response here. Test poll data should match real data for better
            // usability so we create a clean list of subscribers here
            subscribers.forEach((subscriber) => {
                cleanedSubscribers.push({
                    id: subscriber.id,
                    name: subscriber.name,
                    email: subscriber.email
                })
            });

            return cleanedSubscribers;
        });
};

module.exports = {
    // keeping `removed_subscriber` key for backwards compatability
    key: 'removed_subscriber',
    noun: 'Subscriber',

    display: {
        label: 'New Unsubscriber',
        description: 'Triggers when a subscriber unsubscribes.'
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
