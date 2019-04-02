const {initAdminApi} = require('./utils');

const subscribe = (eventName, z, bundle) => {
    const api = initAdminApi(z, bundle.authData);
    // eslint-disable-next-line camelcase
    const [integration_id] = bundle.authData.adminApiKey.split(':');

    // the data returned from webhooks endpoint is added directly to
    // bundle.subscribeData
    return api.webhooks.add({
        integration_id,
        target_url: bundle.targetUrl,
        event: eventName
    });
};

const unsubscribe = (z, bundle) => {
    const api = initAdminApi(z, bundle.authData);
    const id = bundle.subscribeData.id;

    return api.webhooks.delete({id});
};

module.exports = {
    subscribe,
    unsubscribe
};
