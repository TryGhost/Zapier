const NewStoryTrigger = require('./triggers/new_story');
const NewSubscriberTrigger = require('./triggers/new_subscriber');
const RemovedSubscriberTrigger = require('./triggers/removed_subscriber');
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

const includeAuthHeaders = (request, z, bundle) => {
    // Zapier goes through the auth process twice, the second time it will have
    // an auth token but the Authorization header will crash Ghost so we check to
    // make sure we don't add it to token requests
    // TODO: remove the token check once 1.17.1 has rolled out on (pro)
    if (bundle.authData.token && (request.url && !request.url.match(/authentication\/token$/))) {
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
        [RemovedSubscriberTrigger.key]: RemovedSubscriberTrigger
    },

    // If you want your searches to show up, you better include it here!
    searches: {
    },

    // If you want your creates to show up, you better include it here!
    creates: {
    }
};

// Finally, export the app.
module.exports = App;
