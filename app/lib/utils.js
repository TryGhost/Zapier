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
                    const haltedError = new z.errors.HaltedError(message);
                    // expose the status so searches can turn a 404 into an empty result
                    haltedError.status = response.status;
                    throw haltedError;
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
    RequestError
};
