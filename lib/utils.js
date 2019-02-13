const GhostAdminApi = require('@tryghost/admin-api');

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
                throw new Error(error.message);
            } else {
                response.throwForStatus();
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
    initAdminApi
};
