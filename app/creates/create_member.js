const {initAdminApi, versionCheck} = require('../lib/utils');

const createMember = async (z, bundle) => {
    // Members was added in Ghost 3.0
    let expectedVersion = '>=3.0.0';
    let action = 'members';

    const memberData = {
        name: bundle.inputData.name,
        email: bundle.inputData.email,
        note: bundle.inputData.note
    };

    const countSpecified = 'newsletter_count' in bundle.inputData;
    if (countSpecified && bundle.inputData.newsletter_count === 'single') {
        memberData.subscribed = bundle.inputData.subscribed;
    } else if (countSpecified && bundle.inputData.newsletter_count === 'multiple') {
        // Default newsletters is definitely set to false (using !(value !== false) because booleans are sometimes stringified before being set)
        if (!('newsletters_default' in bundle.inputData && bundle.inputData.newsletters_default !== false)) {
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
    if (bundle.inputData.comped) {
        expectedVersion = '>=3.36.0';
        action = 'member complimentary plan';
        memberData.comped = bundle.inputData.comped;
    }

    await versionCheck(expectedVersion, action, z, bundle);

    const api = initAdminApi(z, bundle.authData, {version: 'v3'});

    const queryParams = {};

    if (bundle.inputData.send_email !== undefined) {
        queryParams.send_email = bundle.inputData.send_email;
    } else {
        // NOTE: since the default is always meant to be a boolean true value
        //       falling back to this behavior unless there is some other value
        queryParams.send_email = true;
    }

    if (bundle.inputData.email_type) {
        queryParams.email_type = bundle.inputData.email_type;
    }

    return api.members.add(memberData, queryParams);
};

module.exports = {
    key: 'create_member',
    noun: 'Member',

    display: {
        label: 'Create Member',
        description: 'Creates a member (Only supported by Ghost 3.0.0 and later)',
        important: true
    },

    operation: {
        inputFields: [
            {key: 'name', required: false},
            {key: 'email', required: true},
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
                        label: 'Subscribe to newsletter',
                        type: 'boolean',
                        helpText: 'If false, member will not be subscribed to emails.',
                        required: false
                    }];
                } else if (bundle.inputData.newsletter_count === 'multiple') {
                    return [{
                        key: 'newsletters_default',
                        label: 'Subscribe to default newsletters',
                        type: 'boolean',
                        helpText: 'If false, you can subscribe member to specific newsletters or unsubscribe from all.',
                        required: true,
                        default: true,
                        altersDynamicFields: true
                    }];
                } else {
                    // Should never happen, but occasionally will be the case on load
                    return [];
                }
            },
            function (z, bundle) {
                // Using value !== false because booleans in Zapier are occasionally strings
                if (bundle.inputData.newsletter_count === 'single' || bundle.inputData.newsletters_default !== false) {
                    return [];
                } else {
                    return [{
                        key: 'newsletters',
                        label: 'Newsletter subscriptions',
                        helpText: 'Choose which newsletters the member will be subscribed to',
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
                key: 'send_email',
                label: 'Send email to member?',
                type: 'boolean',
                default: 'true'
            },
            {
                key: 'email_type',
                label: 'Type of email to send',
                required: false,
                choices: [
                    {value: 'signup', label: 'Signup Confirmation', sample: '"You\'ve successfully signed up"'},
                    {value: 'signin', label: 'Login Link', sample: '"Click here to log in"'},
                    {value: 'subscribe', label: 'Newsletter Subscription', sample: '"Confirm your subscription"'}
                ]
            },
            {
                key: 'comped',
                label: 'Complimentary premium plan',
                type: 'boolean',
                helpText: 'If enabled, member will be placed onto a free of charge premium subscription ( >= Ghost 3.36)'
            }
        ],

        perform: createMember,

        sample: {
            id: '5c9c9c8d51b5bf974afad2a4',
            name: 'Test Member',
            email: 'test@example.com',
            subscribed: true,
            comped: false,
            labels: ['Zapier'],
            created_at: '2019-03-28T10:06:05.862Z',
            updated_at: '2019-03-28T10:06:05.862Z'
        }
    }
};
