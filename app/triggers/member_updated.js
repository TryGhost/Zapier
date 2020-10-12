const semver = require('semver');
const {versionCheck} = require('../lib/utils');
const webhooks = require('../lib/webhooks');

// `member.edited` webhook was added in 3.0.3
const SUPPORTED_VERSION = '>=3.0.3';

// we always return a sample payload for this trigger because it's not possible
// to show useful "changed" data when fetching a record from the API

// These fields were available as of Ghost version 3.0.3
const BASE_PAYLOAD = {
    current: {
        id: '5a01d3ecc8d50d0e606a7e7c',
        name: 'New Member Name',
        email: 'sample@example.com',
        note: 'Updated sample member record.',
        created_at: '2019-10-13T18:12:00.000Z',
        updated_at: '2019-10-31T14:58:00.000Z'
    },
    previous: {
        name: 'Old Member Name',
        note: 'Just a sample member record.',
        updated_at: '2019-10-13T18:12:00.000Z'
    }
};

const getVersionedSamplePaypload = (version) => {
    const sample = Object.assign({}, BASE_PAYLOAD);

    // FIND when these were added!
    // if (semver.gte('3.xx')) {
    //     Object.assign(sample.current, {
    //         subscribed: true,
    //         stripe: {
    //             // TODO: check if we want to include this (Stripe subscriptions)
    //             subscriptions: [{
    //                 id: 'sub_IBd21glxXxfNHj',
    //                 customer: {
    //                     id: 'cus_IBd2ovReh2lNws',
    //                     name: null,
    //                     email: null
    //                 },
    //                 plan: {
    //                     id: '79407d14f77543c446a42442405c6587b0c30a30b720936eaded68a49b744e34',
    //                     nickname: 'Complimentary',
    //                     amount: 0,
    //                     interval: 'year',
    //                     currency: 'USD',
    //                     currency_symbol: '$'
    //                 },
    //                 status: 'active',
    //                 start_date: '2020-10-12T01:25:08.000Z',
    //                 default_payment_card_last4: null,
    //                 cancel_at_period_end: false,
    //                 current_period_end: '2021-10-12T01:25:08.000'
    //             }]
    //         }
    //     });
    // }

    // See https://github.com/TryGhost/Ghost/releases/tag/3.4.0 for changelog
    if (semver.gte(version, '3.4.0')) {
        Object.assign(sample.current, {
            comped: true
        });
    }

    // See https://github.com/TryGhost/Ghost/releases/tag/3.6.0 for changelog
    if (semver.gte(version, '3.6.0')) {
        Object.assign(sample.current, {
            labels: [{
                id: '5f212d395422021ebc4b7043',
                name: 'New label',
                slug: 'new-label',
                created_at: '2020-10-13T18:12:00.000Z',
                updated_at: '2020-10-13T18:12:00.000Z'
            }]
        });

        Object.assign(sample.previous, {
            labels: []
        });
    }

    // See https://github.com/TryGhost/Ghost/releases/tag/3.8.0 for changelog
    if (semver.gte(version, '3.8.0')) {
        Object.assign(sample.current, {
            avatar_image: 'https://www.gravatar.com/avatar/1cbf9257d69d61819743dda9d4b0b06d?s=180&d=blank',
            geolocation: {
                longitude: '-2.2417',
                city: 'Kidderminster',
                timezone: 'Europe/London',
                accuracy: 200,
                asn: 8468,
                region: 'England',
                organization_name: 'Entanet',
                organization: 'AS8468 Entanet',
                country_code: 'GB',
                ip: '188.39.113.90',
                latitude: '52.375',
                area_code: '0',
                continent_code: 'EU',
                country: 'United Kingdom',
                country_code3: 'GBR'
            }
        });
    }
    return sample;
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
    const version = await versionCheck(SUPPORTED_VERSION, 'members', z, bundle);

    const samplePayload = getVersionedSamplePaypload(version);

    return Promise.resolve([samplePayload]);
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

        sample: BASE_PAYLOAD
    }
};
