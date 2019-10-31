const {initAdminApi, versionCheck} = require('../lib/utils');

const searchSubscribers = async (z, bundle) => {
    // Ghost 3.0 removes all subscriber routes, show an unsupported error
    await versionCheck('<3.0.0', 'subscribers', z, bundle);

    const api = initAdminApi(z, bundle.authData);
    return api.subscribers.read(bundle.inputData).then((subscriber) => {
        return [subscriber];
    }).catch((err) => {
        // we throw a HaltedError on a 404 so we return an empty array
        // to satisfy the `search` action return type
        if (err.name === 'HaltedError' && err.message.match(/404/)) {
            return [];
        }

        throw err;
    });
};

module.exports = {
    key: 'subscriber',
    noun: 'Subscriber',

    display: {
        label: 'Find a Subscriber (Deprecated)',
        description: 'Search for a subscriber by email address. (Subscribers feature is deprecated and is replaced by [members](https://ghost.org/docs/members/zapier/) in Ghost 3.0 or later)'
    },

    operation: {
        inputFields: [
            {key: 'email', type: 'string', label: 'Email'}
        ],

        perform: searchSubscribers,

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
