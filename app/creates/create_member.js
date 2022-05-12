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

    if ('subscribed' in bundle.inputData) {
        memberData.subscribed = bundle.inputData.subscribed;
    } else if ('newsletters' in bundle.inputData) {
        expectedVersion = '>=4.46.0';
        action = 'member newsletters';
        memberData.newsletters = bundle.inputData.newsletters.map(id => ({id}));
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
                key: 'subscription_option',
                label: 'Subscription type',
                helpText: 'Multiple newsletters for v5+, or a simple "subscribed" option for previous versions',
                required: true,
                choices: {
                    subscribed: 'Subscriptions',
                    newsletters: 'Newsletters (v5+)'
                },
                default: 'subscribed',
                altersDynamicFields: true
            },
            function (z, bundle) {
                if (bundle.inputData.subscription_option === 'subscribed') {
                    return [{
                        key: 'subscribed',
                        label: 'Subscribed to newsletter',
                        type: 'boolean',
                        helpText: 'If false, member will be unsubscribed from all newsletters',
                        required: false
                    }];
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
