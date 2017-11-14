const searchSubscribers = (z, bundle) => {
    return z.request(`/subscribers/email/${bundle.inputData.email}/`)
        .then((response) => {
            if (response.status === 404) {
                return [];
            }

            if (response.status !== 200) {
                try {
                    let [error] = z.JSON.parse(response.content).errors;
                    throw new Error(error.message);

                } catch (e) {
                    throw new Error('Unknown error');
                }
            }

            return z.JSON.parse(response.content).subscribers;
        });
}

module.exports = {
    key: 'subscriber',

    noun: 'Subscriber',
    display: {
        label: 'Find a Subscriber',
        description: 'Search for a subscriber by email address.'
    },

    operation: {
        inputFields: [
            {key: 'email', type: 'string', label: 'Email'}
        ],

        perform: searchSubscribers,

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
