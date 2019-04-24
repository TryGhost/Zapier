const semver = require('semver');
const {initAdminApi, RequestError} = require('./lib/utils');

const SUPPORTED_VERSION = '^2.19';

// Used when first connecting.
// Any truthy response from the returned promise will indicate valid credentials.
// Throwing an error shows the error message to the user
const testAuth = (z, {authData}) => {
    const api = initAdminApi(z, authData);

    // ensure that we can grab the about config (requires auth, will error if invalid)
    return api.site.read().then((config) => {
        const version = semver.coerce(config.version);

        if (!semver.satisfies(version, SUPPORTED_VERSION)) {
            throw new Error(`Supported Ghost version range is ${SUPPORTED_VERSION}, you are using ${config.version}`);
        }

        // anything returned here gets added to `bundle.authData`
        return {
            blogTitle: config.title,
            blogUrl: config.url
        };
    }).catch((err) => {
        if (err instanceof RequestError) {
            // 404 suggests this may be a Ghost blog without v2 or a non-Ghost site
            if (err.res.status === 404) {
                // try fetching a Ghost v0.1 endpoint
                let v01url = `${authData.adminApiUrl}/ghost/api/v0.1/configuration/about/`;
                return z.request(v01url).then((response) => {
                    if (response.status === 401) {
                        throw new Error(`Supported Ghost version range is ${SUPPORTED_VERSION}, you are using an earlier version`);
                    } else {
                        throw new Error('Supplied \'Admin API URL\' does not appear to be valid or does not point to a Ghost site');
                    }
                });
            }
        }

        throw new Error(err.message);
    });
};

module.exports = {
    type: 'custom',

    connectionLabel: '{{bundle.authData.blogUrl}}',

    // The test method allows Zapier to verify that the credentials a user
    // provides are valid. It will be executed whenever a user connects their
    // account for the first time.
    test: testAuth,

    fields: [
        {
            key: 'adminApiUrl',
            label: 'Admin API URL',
            helpText: 'The Admin API URL copied from the Zapier Integration in your Ghost admin area.',
            placeholder: 'https://yoursite.com',
            required: true,
            type: 'string'
        },
        {
            key: 'adminApiKey',
            label: 'Admin API Key',
            helpText: 'The Admin API key copied from the Zapier Integration in your Ghost admin area.',
            placeholder: '5c3e1182e79eace7f58c9c3b:7202e874ccae6f1ee6688bb700f356b672fb078d8465860852652037f7c7459ddbd2f2a6e9aa05a40b499ae20027d9f9ba2e5004aa9ab6510b90a5dac674cbc1',
            required: true,
            type: 'string'
        }
    ]
};
