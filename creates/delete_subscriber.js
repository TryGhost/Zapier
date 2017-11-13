// create a particular subscriber by name
const deleteSubscriber = (z, bundle) => {
    const responsePromise = z.request({
        method: 'DELETE',
        url: `/subscribers/email/${bundle.inputData.email}/`
    });
    return responsePromise;
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
