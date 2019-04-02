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
        label: 'Delete Susbcriber',
        description: 'Deletes a subscriber.'
    },

    operation: {
        inputFields: [
            {key: 'email', required: true}
        ],

        perform: deleteSubscriber
    }
};
