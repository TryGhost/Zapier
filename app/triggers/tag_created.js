const _ = require('lodash');
const {initAdminApi} = require('../lib/utils');
const webhooks = require('../lib/webhooks');

const subscribeWebhook = _.partial(webhooks.subscribe, 'tag.added');
const unsubscribeWebhook = webhooks.unsubscribe;

// triggers on user.added. Formats the API response ready for passing to
// the zap which expects an array
const handleWebhook = (z, bundle) => {
    // bundle.cleanedRequest will include the parsed JSON object (if it's not a
    // test poll) and also a .querystring property with the URL's query string.
    const {user} = bundle.cleanedRequest;

    return [user.current];
};

const listTags = (z, {authData, meta}) => {
    const api = initAdminApi(z, authData);

    if (meta.isFillingDynamicDropdown) {
        return api.tags.browse({
            order: 'name DESC',
            limit: 'all'
        });
    }

    return api.tags.browse({
        order: 'created_at DESC',
        limit: 1
    });
};

module.exports = {
    key: 'tag_created',
    noun: 'Tag',

    display: {
        label: 'Tag Created',
        description: 'Triggers when a new tag is added.',
        hidden: true // only used by authors dynamic dropdown
    },

    operation: {
        inputFields: [],

        type: 'hook',

        performSubscribe: subscribeWebhook,
        performUnsubscribe: unsubscribeWebhook,

        perform: handleWebhook,
        performList: listTags,

        sample: {
            slug: 'getting-started',
            id: '5c34b884ba522a02712f01e8',
            name: 'Getting Started',
            description: null,
            feature_image: null,
            visibility: 'public',
            meta_title: null,
            meta_description: null,
            created_at: '2019-01-08T14:49:40.000Z',
            updated_at: '2019-01-08T14:49:40.000Z',
            url: 'http://localhost:2368/tag/getting-started/'
        }
    }
};
