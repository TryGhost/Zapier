const GhostAdminApi = require('@tryghost/admin-api');

class RequestError extends Error {
    constructor(message, response) {
        super(message);
        this.name = 'RequestError';
        this.response = response;
    }
}

// Convenience method for creating a GhostAdminAPI instance from the bundle data
const initAdminApi = (z, {adminApiUrl, adminApiKey: key}) => {
    const host = adminApiUrl.replace(/\/ghost\/$/, '');

    function makeRequest({url, method, body, params = {}, headers = {}}) {
        return z.request({
            url,
            method,
            headers,
            params,
            body
        }).then((response) => {
            if (response.json && response.json.errors) {
                const [error] = response.json.errors;
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

    return new GhostAdminApi({
        host,
        key,
        version: 'v2',
        makeRequest
    });
};

module.exports = {
    initAdminApi,
    RequestError
};
