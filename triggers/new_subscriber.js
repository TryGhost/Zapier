const subscribeHook = (z, bundle) => {
    let data = {
        target_url: bundle.targetUrl,
        'event': 'subscriber.create'
    };

    let options = {
        url: '/webhooks/',
        method: 'POST',
        body: JSON.stringify(data)
    };

    // the data returned from webhooks endpoint is added directly to
    // bundle.subscribeData
    return z.request(options)
        .then((response) => JSON.parse(response.content));
};

const unsubscribeHook = (z, bundle) => {
    let hookId = bundle.subscribeData.id;

    let options = {
        url: `/webhooks/${hookId}/`,
        method: 'DELETE'
    };

    return z.request(options);
};

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
        url: '/subscribers/'
    };

    return z.request(options)
        .then((response) => {
            let {subscribers} = JSON.parse(response.content);
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
