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

        if (response.status !== 204 && json && json.errors) {
            throw new Error(json.errors[0].message);
        }

        return response;
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
