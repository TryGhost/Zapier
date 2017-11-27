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
            throw new Error(`Subscriber creation failed: ${response.status}.`)
        }

        if (response.status !== 201 && json && json.errors) {
            throw new Error(json.errors[0].message);
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
