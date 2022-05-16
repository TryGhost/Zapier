const {initAdminApi, versionCheck} = require('../lib/utils');

const updateMember = async (z, bundle) => {
    // Members was added in Ghost 3.0
    let expectedVersion = '>=3.0.0';
    let action = 'members';

    const memberData = {
        id: bundle.inputData.id,
        name: bundle.inputData.name,
        email: bundle.inputData.email,
        note: bundle.inputData.note
    };

    const countSpecified = 'newsletter_count' in bundle.inputData;
    if (countSpecified && bundle.inputData.newsletter_count === 'single') {
        memberData.subscribed = bundle.inputData.subscribed;
    } else if (countSpecified && bundle.inputData.newsletter_count === 'multiple') {
        // Default newsletters is definitely set to false (using !(value !== false) because booleans are sometimes stringified before being set)
        if (!('newsletters_keepsame' in bundle.inputData && bundle.inputData.newsletters_keepsame !== false)) {
            expectedVersion = '>=4.46.0';
            action = 'member newsletters';
            memberData.newsletters = 'newsletters' in bundle.inputData
                ? bundle.inputData.newsletters.map(id => ({id}))
                : [];
        }
    } else {
        // Assume single newsletter for older Zaps
        memberData.subscribed = bundle.inputData.subscribed;
    }

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
                key: 'newsletter_count',
                label: 'Number of newsletters',
                required: true,
                choices: {
                    single: 'Single newsletter',
                    multiple: 'Multiple newsletters'
                },
                helpText: 'How many newsletters does your site have? Multiple option for >= Ghost 5.0 only.',
                default: 'single',
                altersDynamicFields: true
            },
            function (z, bundle) {
                if (bundle.inputData.newsletter_count === 'single') {
                    return [{
                        key: 'subscribed',
                        label: 'Subscribed to newsletter',
                        type: 'boolean',
                        helpText: 'If false, member will not be subscribed to emails.',
                        required: false
                    }];
                } else if (bundle.inputData.newsletter_count === 'multiple') {
                    return [{
                        key: 'newsletters_keepsame',
                        label: 'Keep the current set of newsletters for the member',
                        type: 'boolean',
                        required: true,
                        default: true,
                        altersDynamicFields: true
                    }];
                } else {
                    return [];
                }
            },
            function (z, bundle) {
                // Using value !== false because booleans in Zapier are occasionally strings
                if (bundle.inputData.newsletter_count === 'single' || bundle.inputData.newsletters_keepsame !== false) {
                    return [];
                } else {
                    return [{
                        key: 'newsletters',
                        label: 'Newsletter subscriptions',
                        helpText: 'Subscribe member to specific newsletters. Leave blank to unsubscribe from all.',
                        required: false,
                        list: true,
                        dynamic: 'newsletter_created.id.name'
                    }];
                }
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
