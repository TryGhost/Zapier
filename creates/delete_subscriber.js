// create a particular subscriber by name
const deleteSubscriber = (z, bundle) => {
    const responsePromise = z.request({
        method: 'DELETE',
        url: `/subscribers/email/${bundle.inputData.email}/`
    });

    return responsePromise.then((response) => {
        let json;

        try {
            json = z.JSON.parse(response.content);
        } catch (e) {
            // no content or content not json
        }

        // validation error should be halting
        if (response.status === 404 && json && json.errors) {
            let message = json.errors[0].message;

            throw new z.errors.HaltedError(message);
        }


        // unexpected status, eg. 500. Normal error.
        if (response.status !== 204) {
            let message = `Unknown Error: ${response.status}`;

            if (json && json.errors) {
                message = json.errors[0].message;
            }

            throw new Error(message);
        }

        return {};
    });
};

module.exports = {
    key: 'delete_subscriber',
    noun: 'Subscriber',

    display: {
        label: 'Delete Subscriber',
        description: 'Deletes a subscriber.'
    },

    operation: {
        inputFields: [
            {key: 'email', required: true}
        ],

        perform: deleteSubscriber
    }
};
