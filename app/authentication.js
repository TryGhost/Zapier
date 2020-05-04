const semver = require('semver');
const {initAdminApi, RequestError} = require('./lib/utils');

const SUPPORTED_VERSION = '>=2.19';

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

        // make an authenticated request to ensure the API key is valid
        // (some versions of Ghost do not error when an invalid key is used
        //  to access non-authenticated endpoints)
        return api.config.read().then(() => {
            // anything returned here gets added to `bundle.authData`
            return {
                blogTitle: config.title,
                blogUrl: config.url
            };
        });
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

    connectionLabel: '{{blogUrl}}',

    // The test method allows Zapier to verify that the credentials a user
    // provides are valid. It will be executed whenever a user connects their
    // account for the first time.
    test: testAuth,

    fields: [
        {
            key: 'adminApiKey',
            label: 'Admin API Key',
            helpText: 'Find these details in Ghost Admin under `Integrations » Zapier`',
            placeholder: '5c3e1182e79eace7f58c9c3b:7202e874ccae6f1ee6688bb700f356b672fb078d8465860852652037f7c7459ddbd2f2a6e9aa05a40b499ae20027d9f9ba2e5004aa9ab6510b90a5dac674cbc1',
            required: true,
            type: 'string'
        },
        {
            key: 'adminApiUrl',
            label: 'Admin API URL',
            helpText: 'Find these details in Ghost Admin under `Integrations » Zapier`',
            placeholder: 'https://yoursite.com',
            required: true,
            type: 'string'
        }
    ]
};
