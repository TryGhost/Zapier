const {initAdminApi, versionCheck} = require('../lib/utils');
const webhooks = require('../lib/webhooks');

// `member.deleted` webhook was added in 3.0.3
const SUPPORTED_VERSION = '>=3.0.3';

const subscribeWebhook = async (z, bundle) => {
    await versionCheck(SUPPORTED_VERSION, 'members', z, bundle);
    return webhooks.subscribe('member.deleted', z, bundle);
};

const unsubscribeWebhook = async (z, bundle) => {
    await versionCheck(SUPPORTED_VERSION, 'members', z, bundle);
    return webhooks.unsubscribe(z, bundle);
};

// triggers on member.added. Formats the API response ready for passing to
// the zap which expects an array
const handleWebhook = (z, bundle) => {
    // bundle.cleanedRequest will include the parsed JSON object (if it's not a
    // test poll) and also a .querystring property with the URL's query string.
    const {member} = bundle.cleanedRequest;

    return [member.previous];
};

const getLatestMember = async (z, bundle) => {
    await versionCheck(SUPPORTED_VERSION, 'members', z, bundle);

    const api = initAdminApi(z, bundle.authData, {version: 'v3'});

    return api.members
        .browse({order: 'created_at DESC', limit: 1});
};

module.exports = {
    key: 'member_deleted',
    noun: 'Member',

    display: {
        label: 'Member Deleted',
        description: 'Triggers when a member is deleted (requires Ghost 3.0.3 or later).'
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
        performList: getLatestMember,

        sample: {
            id: '5a01d3ecc8d50d0e606a7e7c',
            name: 'Sample Member',
            email: 'sample@example.com',
            note: 'Just a sample member record.',
            created_at: '2019-10-13T18:12:00.000Z',
            updated_at: '2019-10-13T18:12:00.000Z'
        }
    }
};
