const {initAdminApi} = require('../lib/utils');

const createSubscriber = (z, bundle) => {
    const api = initAdminApi(z, bundle.authData);

    return api.subscribers.add(bundle.inputData);
};

module.exports = {
    key: 'create_subscriber',
    noun: 'Subscriber',

    display: {
        label: 'Create Susbcriber (Deprecated)',
        description: 'Creates a subscriber. (Subscribers feature is deprecated and will no longer function in Ghost 3.0 or later)'
    },

    operation: {
        inputFields: [
            {key: 'name', required: false},
            {key: 'email', required: true},
            {key: 'status', required: false, choices: {
                pending: 'Pending',
                subscribed: 'Subscribed',
                unsubscribed: 'Unsubscribed'
            }}
        ],

        perform: createSubscriber,

        sample: {
            id: '5c9c9c8d51b5bf974afad2a4',
            name: 'Test Subscriber',
            email: 'Test Subscriber',
            status: 'subscribed',
            created_at: '2019-03-28T10:06:05.862Z',
            updated_at: '2019-03-28T10:06:05.862Z',
            post_id: null,
            subscribed_url: null,
            subscribed_referrer: null,
            unsubscribed_url: null,
            unsubscribed_at: null
        }
    }
};
