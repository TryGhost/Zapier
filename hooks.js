const subscribeHook = (eventName, z, bundle) => {
    let data = {
        webhooks: [{
            target_url: bundle.targetUrl,
            event: eventName
        }]
    };

    let options = {
        url: '/webhooks/',
        method: 'POST',
        body: JSON.stringify(data)
    };

    // the data returned from webhooks endpoint is added directly to
    // bundle.subscribeData
    return z.request(options)
        .then((response) => z.JSON.parse(response.content).webhooks[0]);
};

const unsubscribeHook = (z, bundle) => {
    let hookId = bundle.subscribeData.id;

    let options = {
        url: `/webhooks/${hookId}/`,
        method: 'DELETE'
    };

    return z.request(options);
};

module.exports = {
    subscribeHook,
    unsubscribeHook
};
