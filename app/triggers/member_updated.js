const {versionCheck} = require('../lib/utils');
const webhooks = require('../lib/webhooks');

// `member.edited` webhook was added in 3.0.3
const SUPPORTED_VERSION = '>=3.0.3';

// we always return a sample payload for this trigger because it's not possible
// to show useful "changed" data when fetching a record from the API
const SAMPLE_PAYLOAD = {
    current: {
        id: '5a01d3ecc8d50d0e606a7e7c',
        name: 'New Member Name',
        email: 'sample@example.com',
        note: 'Updated sample member record.',
        subscribed: false,
        comped: true,
        labels: [{
            id: '5f212d395422021ebc4b7043',
            name: 'Old label 1',
            slug: 'old-label-1',
            created_at: '2020-10-13T18:12:00.000Z',
            updated_at: '2020-10-13T18:12:00.000Z'
        }, {
            id: '5f212d395422021ebc4b7043',
            name: 'New label',
            slug: 'new-label',
            created_at: '2020-10-13T18:12:00.000Z',
            updated_at: '2020-10-13T18:12:00.000Z'
        }],
        created_at: '2019-10-13T18:12:00.000Z',
        updated_at: '2019-10-31T19:58:00.000Z'
    },
    previous: {
        name: 'Old Member Name',
        email: 'oldsample@example.com',
        note: 'Old sample member record.',
        subscribed: true,
        comped: false,
        labels: [{
            id: '5f212d395422021ebc4b7043',
            name: 'Old label 1',
            slug: 'old-label-1',
            created_at: '2020-10-13T18:12:00.000Z',
            updated_at: '2020-10-13T18:12:00.000Z'
        }, {
            id: '5f212d395422021ebc4b7043',
            name: 'Old label 2',
            slug: 'old-label 2',
            created_at: '2020-10-13T18:12:00.000Z',
            updated_at: '2020-10-13T18:12:00.000Z'
        }],
        updated_at: '2019-10-13T18:12:00.000Z'
    }
};

const subscribeWebhook = async (z, bundle) => {
    await versionCheck(SUPPORTED_VERSION, 'members', z, bundle);

    return webhooks.subscribe('member.edited', z, bundle);
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

    return [member];
};

const getSamplePayload = async (z, bundle) => {
    await versionCheck(SUPPORTED_VERSION, 'members', z, bundle);

    return Promise.resolve([SAMPLE_PAYLOAD]);
};

module.exports = {
    key: 'member_updated',
    noun: 'Member',

    display: {
        label: 'Member Updated',
        description: 'Triggers when a member is updated (requires Ghost 3.0.3 or later).'
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
