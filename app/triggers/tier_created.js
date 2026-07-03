const { initAdminApi } = require('../lib/utils');
const webhooks = require('../lib/webhooks');

const subscribeWebhook = (z, bundle) => {
    return webhooks.subscribe('tier.added', z, bundle);
};

const unsubscribeWebhook = (z, bundle) => {
    return webhooks.unsubscribe(z, bundle);
};

// triggers on tier.added. Formats the API response ready for passing to
// the zap which expects an array
const handleWebhook = (z, bundle) => {
    // bundle.cleanedRequest will include the parsed JSON object (if it's not a
    // test poll) and also a .querystring property with the URL's query string.
    const { tier } = bundle.cleanedRequest;

    return [tier.current];
};

// complimentary subscriptions only make sense for active paid tiers - the
// same set Ghost Admin's own "Make complimentary" UI offers
const TIER_FILTER = 'type:paid+active:true';

const listTiers = (z, bundle) => {
    const { authData, meta } = bundle;

    const api = initAdminApi(z, authData);

    if (meta.isFillingDynamicDropdown) {
        return api.tiers.browse({
            filter: TIER_FILTER,
            order: 'name DESC',
            limit: 'all',
        });
    }

    return api.tiers.browse({
        filter: TIER_FILTER,
        order: 'created_at DESC',
        limit: 1,
    });
};

module.exports = {
    key: 'tier_created',
    noun: 'Tier',

    display: {
        label: 'Tier Created',
        description: 'Triggers when a new tier is added.',
        hidden: true, // only used by tier dynamic dropdown
    },

    operation: {
        inputFields: [],

        type: 'hook',

        performSubscribe: subscribeWebhook,
        performUnsubscribe: unsubscribeWebhook,

        perform: handleWebhook,
        performList: listTiers,

        sample: {
            id: '6220aa04dd8021001c50e6e2',
            name: 'Premium',
            description: null,
            slug: 'premium',
            active: true,
            type: 'paid',
            welcome_page_url: null,
            created_at: '2022-03-03T11:16:52.000Z',
            updated_at: '2022-03-03T11:16:52.000Z',
            visibility: 'public',
            benefits: [],
            currency: 'USD',
            monthly_price: 500,
            yearly_price: 5000,
            trial_days: 0,
        },
    },
};
