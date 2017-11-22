const semver = require('semver');

const SUPPORTED_VERSION = '^1.18.0';

const testAuth = (z) => {
    let promise = z.request({
        url: `/configuration/about/`
    });

    // This method can return any truthy value to indicate valid credentials
    // Raise an error to show an error message
    return promise.then((response) => {
        if (response.status === 401) {
            throw new Error('The username/password you supplied is invalid');
        }

        if (response.status !== 200) {
            throw new Error(`An error occurred testing authentication. Received status code ${response.status}`);
        }

        let [config] = z.JSON.parse(response.content).configuration;

        if (!semver.satisfies(config.version, SUPPORTED_VERSION)) {
            throw new Error(`Supported Ghost version range is ${SUPPORTED_VERSION}, you are using ${config.version}`);
        }

        return response;
    });
}

const getBlogConfig = (z, bundle) => {
    let promise = z.request({
        url: '/configuration/'
    });

    return promise.then((response) => {
        if (response.status !== 200) {
            throw new Error(`Unable to fetch blog config, please check your Admin URL. Received status code ${response.status}`);
        }

        let json = z.JSON.parse(response.content);
        return json.configuration[0];
    });
}

const getAuthToken = (z, bundle) => {
    return getBlogConfig(z, bundle).then((config) => {
        let promise = z.request({
            method: 'POST',
            url: '/authentication/token',
            body: {
                grant_type: 'password',
                username: bundle.authData.email,
                password: bundle.authData.password,
                client_id: config.clientId,
                client_secret: config.clientSecret
            }
        });

        return promise.then((response) => {
            let json;

            try {
                json = z.JSON.parse(response.content);
            } catch (e) {
                // content was not JSON
            }

            // display the server-provided error message if we have one
            if (json && json.errors && json.errors[0] && json.errors[0].message) {
                throw new Error(json.errors[0].message);
            }

            if (response.status === 401) {
                throw new Error('The email/password you supplied is invalid');
            }

            if (response.status !== 200) {
                throw new Error(`Authentication failed. Received status code ${response.status}`);
            }

            if (!json) {
                throw new Error('Authentication failed. Unexpected response');
            }

            return {
                token: json.access_token,
                clientId: config.clientId,
                clientSecret: config.clientSecret,
                blogTitle: config.blogTitle,
                blogUrl: config.blogUrl
            }
        });
    });
}

module.exports = {
    type: 'session',

    // this is used to differentiate connections for use in the Zap editor and
    // "Connected Accounts" section of Zapier
    connectionLabel: '{{bundle.authData.email}} @ {{bundle.authData.blogTitle}}',

    // The user will be prompted to enter this info when they connect their account
    fields: [
        {
            key: 'adminUrl',
            label: 'Admin URL',
            helpText: 'The URL of your Ghost admin area, using HTTPS. Should look like: `https://example.com/ghost/`.',
            placeholder: 'https://yourblog.com/ghost/',
            required: true,
            type: 'string'
        },
        {
            key: 'email',
            label: 'Email',
            helpText: 'The email you use to login to your Ghost blog\'s admin area. Make sure this user has the Owner or Administrator role.',
            required: true,
            type: 'string'
        },
        {
            key: 'password',
            label: 'Password',
            required: true,
            type: 'password'
        }
    ],

    // The test method allows Zapier to verify that the credentials a user
    // provides are valid. It will be executed whenever a user connects their
    // account for the first time.
    test: testAuth,

    // The method that will exchange the fields provided by the user for an
    // auth token
    sessionConfig: {
        perform: getAuthToken
    }
}
