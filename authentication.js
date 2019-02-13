const semver = require('semver');
const {initAdminApi} = require('./lib/utils');

// TODO: update to version where Admin API is stable
const SUPPORTED_VERSION = '^2.13.2';

// Used when first connecting.
// Any truthy response from the returned promise will indicate valid credentials.
// Throwing an error shows the error message to the user
const testAuth = (z, bundle) => {
    const api = initAdminApi(z, bundle);

    // ensure that we can grab the about config (requires auth, will error if invalid)
    return api.configuration.about.read().then((config) => {
        if (!semver.satisfies(config.version, SUPPORTED_VERSION)) {
            throw new Error(`Supported Ghost version range is ${SUPPORTED_VERSION}, you are using ${config.version}`);
        }

        return true;
    });
};

module.exports = {
    type: 'custom',

    // The test method allows Zapier to verify that the credentials a user
    // provides are valid. It will be executed whenever a user connects their
    // account for the first time.
    test: testAuth,

    fields: [
        {
            key: 'adminApiUrl',
            label: 'Admin API URL',
            helpText: 'The Admin API URL copied from the Zapier Integration in your Ghost admin area.',
            placeholder: 'https://yoursite.com/ghost/api/',
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
