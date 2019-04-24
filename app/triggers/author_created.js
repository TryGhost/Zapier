const _ = require('lodash');
const {initAdminApi} = require('../lib/utils');
const webhooks = require('../lib/webhooks');

const subscribeWebhook = _.partial(webhooks.subscribe, 'user.added');
const unsubscribeWebhook = webhooks.unsubscribe;

// triggers on user.added. Formats the API response ready for passing to
// the zap which expects an array
const handleWebhook = (z, bundle) => {
    // bundle.cleanedRequest will include the parsed JSON object (if it's not a
    // test poll) and also a .querystring property with the URL's query string.
    const {user} = bundle.cleanedRequest;

    return [user.current];
};

const listAuthors = (z, {authData, meta}) => {
    const api = initAdminApi(z, authData);

    if (meta.isFillingDynamicDropdown) {
        return api.users.browse({
            order: 'name DESC',
            limit: 'all'
        });
    }

    return api.users.browse({
        order: 'created_at DESC',
        limit: 1
    });
};

module.exports = {
    key: 'author_created',
    noun: 'Author',

    display: {
        label: 'Author Created',
        description: 'Triggers when a new author is added.',
        hidden: true // only used by authors dynamic dropdown
    },

    operation: {
        inputFields: [],

        type: 'hook',

        performSubscribe: subscribeWebhook,
        performUnsubscribe: unsubscribeWebhook,

        perform: handleWebhook,
        performList: listAuthors,

        sample: {
            slug: 'ghost',
            id: '5951f5fca366002ebd5dbef7',
            name: 'Ghost',
            email: 'ghost-author@example.com',
            profile_image: 'https://static.ghost.org/v2.0.0/images/ghost.png',
            cover_image: null,
            bio: 'You can delete this user to remove all the welcome posts',
            website: 'https://ghost.org',
            location: 'The Internet',
            facebook: 'ghost',
            twitter: 'tryghost',
            accessibility: null,
            status: 'active',
            meta_title: null,
            meta_description: null,
            tour: null,
            last_seen: null,
            created_at: '2019-01-08T14:49:40.000Z',
            updated_at: '2019-01-08T14:49:40.000Z',
            url: 'http://localhost:2368/author/ghost/'
        }
    }
};
