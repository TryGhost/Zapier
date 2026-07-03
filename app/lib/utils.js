const GhostAdminApi = require('@tryghost/admin-api');
// the SDK does not re-export its token signer, but the grafted tiers
// resource in initAdminApi needs it to authenticate like the SDK resources
// do - a moved file would fail at require time and every test would catch it
const generateToken = require('@tryghost/admin-api/lib/token');
const packageInfo = require('../../package.json');
const packageVersion = packageInfo.version;

// Single source of truth for the Ghost compatibility floor - the auth-time
// version check and the Accept-Version request header must move together
const GHOST_MAJOR = 6;
const SUPPORTED_GHOST_VERSION = `>=${GHOST_MAJOR}.0`;
const ADMIN_API_VERSION = `v${GHOST_MAJOR}.0`;
class RequestError extends Error {
    constructor(message, res) {
        super(message);
        this.name = 'RequestError';
        // `res` rather than `response` because @tryghost/admin-api strips `response`
        this.res = res;
    }
}

// Convenience method for creating a GhostAdminAPI instance from the bundle data
const initAdminApi = (z, { adminApiUrl: adminUrl, adminApiKey: key }) => {
    function makeRequest({ url, method, data: body, params = {}, headers = {} }) {
        // the SDK normally sends its own User-Agent - prefix it with ours,
        // coping with it being absent so we never send "... undefined"
        headers['User-Agent'] = [`Zapier/${packageVersion}`, headers['User-Agent']]
            .filter(Boolean)
            .join(' ');

        return z
            .request({
                url,
                method,
                headers,
                params,
                body,
                skipThrowForStatus: true,
            })
            .then((response) => {
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
                        const haltedError = new z.errors.HaltedError(message);
                        // expose the status so searches can turn a 404 into an empty result
                        haltedError.status = response.status;
                        throw haltedError;
                    }

                    throw new RequestError(error.message, response);
                } else if (response.status > 300) {
                    // adapted from `response.throwForStatus()` to expose the response
                    // https://github.com/zapier/zapier-platform-core/blob/master/src/http-middlewares/after/throw-for-status.js
                    const message = `Got ${response.status} calling ${response.request.method} ${
                        response.request.url
                    }, expected 2xx.`;

                    throw new RequestError(message, response);
                }

                return response.json;
            });
    }

    const api = new GhostAdminApi({
        url: adminUrl,
        key,
        makeRequest,
        // 'v{major}.{minor}' targets the unversioned /ghost/api/admin/
        // endpoints and is sent as the Accept-Version request header
        version: ADMIN_API_VERSION,
    });

    // @tryghost/admin-api 1.14.10 has no tiers resource, so graft a
    // browse-only one on. It goes through the same makeRequest as the SDK
    // resources, keeping error handling and the User-Agent prefix identical.
    api.tiers = {
        browse(params = {}) {
            return makeRequest({
                url: `${adminUrl}/ghost/api/admin/tiers/`,
                method: 'GET',
                params,
                headers: {
                    // '/admin/' is the token audience for the unversioned
                    // Admin API - the same value the SDK derives internally
                    Authorization: `Ghost ${generateToken(key, '/admin/')}`,
                    'Accept-Version': ADMIN_API_VERSION,
                },
            }).then((data) => data.tiers);
        },
    };

    return api;
};

/**
 * Detects the halting error thrown by `initAdminApi` for a Ghost 404 response.
 * Searches use this to return an empty result set instead of erroring when
 * nothing matches the search input.
 *
 * @param {Error & {status?: number}} err error caught from an Admin API call
 * @returns {boolean}
 */
const isNotFoundHaltedError = (err) => {
    return err.name === 'HaltedError' && err.status === 404;
};

module.exports = {
    initAdminApi,
    isNotFoundHaltedError,
    RequestError,
    SUPPORTED_GHOST_VERSION,
};
