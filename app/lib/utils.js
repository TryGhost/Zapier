const semver = require('semver');
const GhostAdminApi = require('@tryghost/admin-api');
const packageInfo = require('../../package.json');
const packageVersion = packageInfo.version;
class RequestError extends Error {
    constructor(message, res) {
        super(message);
        this.name = 'RequestError';
        // `res` rather than `response` because @tryghost/admin-api strips `response`
        this.res = res;
    }
}

// Convenience method for creating a GhostAdminAPI instance from the bundle data
const initAdminApi = (z, {adminApiUrl: adminUrl, adminApiKey: key}, _options = {}) => {
    function makeRequest({url, method, data: body, params = {}, headers = {}}) {
        if (headers['User-Agent']) {
            headers['User-Agent'] = `Zapier/${packageVersion} ${headers['User-Agent']}`;
        } else {
            headers['User-Agent'] = `Zapier/${packageVersion}`;
        }

        return z.request({
            url,
            method,
            headers,
            params,
            body,
            skipThrowForStatus: true
        }).then((response) => {
            if (response.json && response.json.errors) {
                const [error] = response.json.errors;

                // throw a HaltedError for validation and 404 errors so the Zap
                // doesn't get turned off due to errors from invalid user input
                if (error.type === 'ValidationError' || error.type === 'NotFoundError') {
                    let errorCode = error.type;
                    if (error.code) {
                        errorCode = `${errorCode}: ${error.code}`;
                    }
                    const message = `${error.context || error.message} (${errorCode})`;
                    throw new z.errors.HaltedError(message);
                }

                // eslint-disable-next-line no-restricted-syntax
                throw new RequestError(error.message, response);
            } else if (response.status > 300) {
                // adapted from `response.throwForStatus()` to expose the response
                // https://github.com/zapier/zapier-platform-core/blob/master/src/http-middlewares/after/throw-for-status.js
                const message = `Got ${response.status} calling ${response.request.method} ${
                    response.request.url
                }, expected 2xx.`;

                // eslint-disable-next-line no-restricted-syntax
                throw new RequestError(message, response);
            }

            return response.json;
        });
    }

    const defaultOptions = {
        url: adminUrl,
        key,
        makeRequest,
        version: 'v2'
    };
    const options = Object.assign({}, defaultOptions, _options);

    return new GhostAdminApi(options);
};

/**
 * Checks if version needed to perform an action satisfies connected Ghost instance.
 * Ghost version is taken from site endpoint (https://ghost.org/docs/api/v3/admin/#the-site-object)
 * "Semver String (major.minor) The current version of the Ghost site. Use this to check the minimum
 * version is high enough for compatibility with integrations.". Based on this patch version is not
 * taken into account during the check.
 *
 * @param {String} semverRange semver string, e.g.: `> 3.6' the patch version is not taken into account
 * @param {String} action name of the action that was attempted, e.g.: 'member labels'
 * @param {Object} z Zapier's internal z object, passed in as first argument to all function calls in Zapier app
 * @param {Object} bundle Zapier's internal bundle object, holds the user’s auth details and the data for the API requests.
 */
const versionCheck = (semverRange, action, z, {authData}) => {
    const api = initAdminApi(z, authData);

    return api.site.read().then((config) => {
        const version = semver.coerce(config.version);

        if (!semver.satisfies(version, semverRange)) {
            const message = `The version of Ghost your site is using does not support ${action}. Supported version range is ${semverRange}, you are using ${config.version}.`;
            throw new z.errors.HaltedError(message);
        }
    });
};

module.exports = {
    initAdminApi,
    versionCheck,
    RequestError
};
