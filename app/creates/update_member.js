const {initAdminApi, versionCheck} = require('../lib/utils');

const updateMember = async (z, bundle) => {
    // Members was added in Ghost 3.0
    let expectedVersion = '>=3.0.0';
    let action = 'members';

    const memberData = {
        id: bundle.inputData.id,
        name: bundle.inputData.name,
        email: bundle.inputData.email,
        note: bundle.inputData.note,
        subscribed: bundle.inputData.subscribed
    };

    // Member Labels was added in Ghost 3.6
    if (bundle.inputData.labels && bundle.inputData.labels.length > 0) {
        expectedVersion = '>=3.6.0';
        action = 'member labels';
        memberData.labels = bundle.inputData.labels;
    }

    // Member Complimentary plan was in Ghost 3.36
    if (bundle.inputData.comped !== undefined) {
        expectedVersion = '>=3.36.0';
        action = 'member complimentary plan';
        memberData.comped = bundle.inputData.comped;
    }

    await versionCheck(expectedVersion, action, z, bundle);

    const api = initAdminApi(z, bundle.authData, {version: 'v3'});

    const queryParams = {};

    return api.members.edit(memberData, queryParams);
};

module.exports = {
    key: 'update_member',
    noun: 'Member',

    display: {
        label: 'Update Member',
        description: 'Updates a member (Only supported by Ghost 3.0.0 and later)',
        important: true
    },

    operation: {
        inputFields: [
            {
                key: 'id',
                required: true,
                label: 'Member',
                dynamic: 'member_created.id.name',
                search: 'member.id'
            },
            {key: 'name', required: false},
            {key: 'email', required: false},
            {key: 'note', required: false},
            {
                key: 'subscribed',
                label: 'Subscribed to newsletter',
                type: 'boolean',
                helpText: 'If false, member will be unsubscribed from all newsletters',
                required: false
            },
            {
                key: 'labels',
                required: false,
                list: true,
                helpText: 'Provide a list of labels to attach to the member ( >= Ghost 3.6)'
            },
            {
                key: 'comped',
                label: 'Complimentary premium plan',
                type: 'boolean',
                helpText: 'If enabled, member will be placed onto a free of charge premium subscription ( >= Ghost 3.36)'
            }
        ],

        perform: updateMember,

        sample: {
            id: '5c9c9c8d51b5bf974afad2a4',
            name: 'Test Member',
            email: 'test@example.com',
            comped: false,
            subscribed: true,
            labels: ['Zapier'],
            created_at: '2019-03-28T10:06:05.862Z',
            updated_at: '2019-03-28T10:06:05.862Z'
        }
    }
};
