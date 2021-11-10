const {initAdminApi, versionCheck} = require('../lib/utils');

const deleteSubscriber = async (z, bundle) => {
    // Ghost 3.0 removes all subscriber routes, show an unsupported error
    await versionCheck('<3.0.0', 'subscribers', z, bundle);

    const api = initAdminApi(z, bundle.authData);

    return api.subscribers.delete(bundle.inputData).then(() => {
        // Zapier requires an object back but @tryghost/admin-api returns undefined
        // Return the inputData as it's all we have - Zapier requires a sample with,
        // a minimum length of 1 so doing this allows sample and return data to match
        return bundle.inputData;
    });
};

module.exports = {
    key: 'delete_subscriber',
    noun: 'Subscriber',

    display: {
        label: 'Delete Subscriber (Deprecated)',
        description: 'Deletes a subscriber. (Subscribers feature is deprecated and is replaced by [members](https://ghost.org/docs/members/zapier/) in Ghost 3.0 or later)',
        hidden: true
    },

    operation: {
        inputFields: [
            {key: 'email', required: true}
        ],

        perform: deleteSubscriber,

        sample: {
            email: 'sample@example.com'
        }
    }
};
