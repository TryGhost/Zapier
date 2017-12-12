// create a particular subscriber by name
const createSubscriber = (z, bundle) => {
    const responsePromise = z.request({
        method: 'POST',
        url: '/subscribers/',
        body: JSON.stringify({
            subscribers: [{
                name: bundle.inputData.name,
                email: bundle.inputData.email
            }]
        })
    });

    return responsePromise.then((response) => {
        let json;

        try {
            json = z.JSON.parse(response.content);
        } catch (e) {
            // noop
        }

        // validation error should be halting and have a friendly message
        if (response.status === 422 && json && json.errors) {
            let message = json.errors[0].message;

            if (message.indexOf('isEmail') >= 0) {
                message = `"${bundle.inputData.email}" is not a valid email address.`;
            }

            throw new z.errors.HaltedError(message);
        }

        // unexpected status, eg. 500. Normal error.
        if (![200,201].includes(response.status)) {
            let message = `Unknown Error: ${response.status}`;

            if (json && json.errors) {
                message = json.errors[0].message;
            }

            throw new Error(message);
        }

        if (!json || (json && !json.subscribers)) {
            throw new Error('Response was not JSON or was incorrectly formatted.');
        }

        return json.subscribers[0];
    });
};

module.exports = {
    key: 'create_subscriber',
    noun: 'Subscriber',

    display: {
        label: 'Create Subscriber',
        description: 'Creates a subscriber.'
    },

    operation: {
        inputFields: [
            {key: 'name', required: false},
            {key: 'email', required: true}
        ],

        perform: createSubscriber,

        sample: {
            id: '5a01d3ecc8d50d0e606a7e7c',
            name: 'Test Subscriber',
            email: 'test@example.com'
        },

        outputFields: [
            {key: 'id', label: 'ID'},
            {key: 'name', label: 'Name'},
            {key: 'email', label: 'Email'}
        ]
    }
};
