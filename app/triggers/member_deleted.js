const { initAdminApi } = require('../lib/utils');
const webhooks = require('../lib/webhooks');

const subscribeWebhook = (z, bundle) => {
    return webhooks.subscribe('member.deleted', z, bundle);
};

const unsubscribeWebhook = (z, bundle) => {
    return webhooks.unsubscribe(z, bundle);
};

// triggers on member.added. Formats the API response ready for passing to
// the zap which expects an array
const handleWebhook = (z, bundle) => {
    // bundle.cleanedRequest will include the parsed JSON object (if it's not a
    // test poll) and also a .querystring property with the URL's query string.
    const { member } = bundle.cleanedRequest;

    return [member.previous];
};

const getLatestMember = (z, bundle) => {
    const api = initAdminApi(z, bundle.authData);

    return api.members.browse({ order: 'created_at DESC', limit: 1 });
};

module.exports = {
    key: 'member_deleted',
    noun: 'Member',

    display: {
        label: 'Member Deleted',
        description: 'Triggers when a member is deleted.',
    },

    operation: {
        // we don't need any input from the user for this trigger
        inputFields: [],

        // use resthooks rather than polling
        type: 'hook',

        performSubscribe: subscribeWebhook,
        performUnsubscribe: unsubscribeWebhook,

        perform: handleWebhook,
        performList: getLatestMember,

        // matches the `member.previous` webhook payload, which omits the
        // subscription flags included by other member events
        sample: {
            id: '5a01d3ecc8d50d0e606a7e7c',
            uuid: '42f50516-9d4f-4062-86fe-dc170d2b391c',
            email: 'sample@example.com',
            name: 'Sample Member',
            note: 'Just a sample member record.',
            status: 'free',
            labels: [
                {
                    id: '5f212d395422021ebc4b7043',
                    name: 'Zapier',
                    slug: 'zapier',
                    created_at: '2019-10-13T18:12:00.000Z',
                    updated_at: '2019-10-13T18:12:00.000Z',
                },
            ],
            newsletters: [
                {
                    id: '62e12664bbd0f0cb56f6f7d1',
                    name: 'Sample Newsletter',
                    description: null,
                    status: 'active',
                },
            ],
            created_at: '2019-10-13T18:12:00.000Z',
            updated_at: '2019-10-13T18:12:00.000Z',
        },
    },
};
