const webhooks = require('../lib/webhooks');

// we always return a sample payload for this trigger because it's not possible
// to show useful "changed" data when fetching a record from the API
const SAMPLE_PAYLOAD = {
    current: {
        id: '5a01d3ecc8d50d0e606a7e7c',
        uuid: '42f50516-9d4f-4062-86fe-dc170d2b391c',
        email: 'sample@example.com',
        name: 'New Member Name',
        note: 'Updated sample member record.',
        subscribed: false,
        status: 'paid',
        comped: true,
        avatar_image: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?s=250&r=g&d=blank',
        labels: [{
            id: '5f212d395422021ebc4b7043',
            name: 'Old label 1',
            slug: 'old-label-1',
            created_at: '2020-10-13T18:12:00.000Z',
            updated_at: '2020-10-13T18:12:00.000Z'
        }, {
            id: '5f212d395422021ebc4b7044',
            name: 'New label',
            slug: 'new-label',
            created_at: '2020-10-13T18:12:00.000Z',
            updated_at: '2020-10-13T18:12:00.000Z'
        }],
        newsletters: [{
            id: '62e12664bbd0f0cb56f6f7d1',
            name: 'Sample Newsletter',
            description: null,
            status: 'active'
        }],
        created_at: '2019-10-13T18:12:00.000Z',
        updated_at: '2019-10-31T19:58:00.000Z'
    },
    // the real webhook's `previous` object only contains the attributes
    // that changed with this edit
    previous: {
        name: 'Old Member Name',
        email: 'oldsample@example.com',
        note: 'Old sample member record.',
        subscribed: true,
        status: 'free',
        comped: false,
        labels: [{
            id: '5f212d395422021ebc4b7043',
            name: 'Old label 1',
            slug: 'old-label-1',
            created_at: '2020-10-13T18:12:00.000Z',
            updated_at: '2020-10-13T18:12:00.000Z'
        }, {
            id: '5f212d395422021ebc4b7045',
            name: 'Old label 2',
            slug: 'old-label-2',
            created_at: '2020-10-13T18:12:00.000Z',
            updated_at: '2020-10-13T18:12:00.000Z'
        }],
        updated_at: '2019-10-13T18:12:00.000Z'
    }
};

const subscribeWebhook = (z, bundle) => {
    return webhooks.subscribe('member.edited', z, bundle);
};

const unsubscribeWebhook = (z, bundle) => {
    return webhooks.unsubscribe(z, bundle);
};

// triggers on member.added. Formats the API response ready for passing to
// the zap which expects an array
const handleWebhook = (z, bundle) => {
    // bundle.cleanedRequest will include the parsed JSON object (if it's not a
    // test poll) and also a .querystring property with the URL's query string.
    const {member} = bundle.cleanedRequest;

    return [member];
};

const getSamplePayload = () => {
    return Promise.resolve([SAMPLE_PAYLOAD]);
};

module.exports = {
    key: 'member_updated',
    noun: 'Member',

    display: {
        label: 'Member Updated',
        description: 'Triggers when a member is updated.'
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
        performList: getSamplePayload,

        sample: SAMPLE_PAYLOAD
    }
};
