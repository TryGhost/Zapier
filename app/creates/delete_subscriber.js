const {initAdminApi} = require('../lib/utils');

const deleteSubscriber = (z, bundle) => {
    const api = initAdminApi(z, bundle.authData);

    return api.subscribers.delete(bundle.inputData).then(() => {
        // Zapier requires an object back but @tryghost/admin-api returns undefined
        return {};
    });
};

module.exports = {
    key: 'delete_subscriber',
    noun: 'Subscriber',

    display: {
        label: 'Delete Susbcriber (Deprecated)',
        description: 'Deletes a subscriber. (Subscribers feature is deprecated and will no longer function in Ghost 3.0 or later)'
    },

    operation: {
        inputFields: [
            {key: 'email', required: true}
        ],

        perform: deleteSubscriber
    }
};
