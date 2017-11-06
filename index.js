const authentication = require('./authentication');

const setApiHost = (request, z, bundle) => {
    let host = bundle.authData.adminUrl.replace(/\/?$/, '');
    let path = request.url.replace(/^\//, '');
    let fullUrl = `${host}/api/v0.1/${path}`;

    request.url = fullUrl;
    return request;
}

const includeAuthHeaders = (request, z, bundle) => {
    if (bundle.authData.token) {
        request.headers = request.headers || {};
        request.headers['Authorization'] = `Bearer ${bundle.authData.token}`;
    }

    return request;
}

const sessionRefreshIf401 = (response, z, bundle) => {
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
        sessionRefreshIf401
    ],

    // If you want to define optional resources to simplify creation of triggers, searches, creates - do that here!
    resources: {
    },

    // If you want your trigger to show up, you better include it here!
    triggers: {
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
