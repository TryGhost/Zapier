const SubscriberCreate = require('./creates/create_subscriber');
const SubscriberDelete = require('./creates/delete_subscriber');
const SubscriberSearch = require('./searches/subscriber');
const SubscriberSearchOrCreate = require('./search_or_creates/subscriber');
const NewStoryTrigger = require('./triggers/new_story');
const NewSubscriberTrigger = require('./triggers/new_subscriber');
const NewUnsubscriberTrigger = require('./triggers/new_unsubscriber');
const authentication = require('./authentication');

const setApiHost = (request, z, bundle) => {
    let host = bundle.authData.adminUrl.replace(/\/?$/, '');
    let path = request.url.replace(/^\//, '');
    let fullUrl = `${host}/api/v0.1/${path}`;

    request.url = fullUrl;

    if (!request.headers['Content-Type']) {
        request.headers['Content-Type'] = 'application/json; charset=utf-8';
    }

    return request;
}

const SKIPPED_AUTH_REGEX = /\/authentication\/token/;

const includeAuthHeaders = (request, z, bundle) => {
    if (bundle.authData.token && !SKIPPED_AUTH_REGEX.test(request.url)) {
        request.headers = request.headers || {};
        request.headers['Authorization'] = `Bearer ${bundle.authData.token}`;
    }

    return request;
}

const tokenRefreshIf401 = (response, z, bundle) => {
    if (bundle.authData.token && response.status === 401) {
        throw new z.errors.RefreshAuthError('Auth token needs refreshing.');
    }

    return response;
}

// We can roll up all our behaviors in an App.
const App = {
    // This is just shorthand to reference the installed dependencies you have. Zapier will
    // need to know these before we can upload
    version: require('./package.json').version,
    platformVersion: require('zapier-platform-core').version,

    authentication: authentication,

    // beforeRequest & afterResponse are optional hooks into the provided HTTP client
    beforeRequest: [
        setApiHost,
        includeAuthHeaders
    ],

    afterResponse: [
        tokenRefreshIf401
    ],

    // If you want to define optional resources to simplify creation of triggers, searches, creates - do that here!
    resources: {
    },

    // If you want your trigger to show up, you better include it here!
    triggers: {
        [NewStoryTrigger.key]: NewStoryTrigger,
        [NewSubscriberTrigger.key]: NewSubscriberTrigger,
        [NewUnsubscriberTrigger.key]: NewUnsubscriberTrigger
    },

    // If you want your searches to show up, you better include it here!
    searches: {
        [SubscriberSearch.key]: SubscriberSearch,
    },

    // If you want your creates to show up, you better include it here!
    creates: {
        [SubscriberCreate.key]: SubscriberCreate,
        [SubscriberDelete.key]: SubscriberDelete,
    },

    searchOrCreates: {
        [SubscriberSearchOrCreate.key]: SubscriberSearchOrCreate
    }
};

// Finally, export the app.
module.exports = App;
