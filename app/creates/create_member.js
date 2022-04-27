const {initAdminApi} = require('../lib/utils');

const createMember = async (z, bundle) => {
    const memberData = {
        name: bundle.inputData.name,
        email: bundle.inputData.email,
        note: bundle.inputData.note,
        subscribed: bundle.inputData.subscribed
    };

    if (bundle.inputData.labels && bundle.inputData.labels.length > 0) {
        memberData.labels = bundle.inputData.labels;
    }

    if (bundle.inputData.comped) {
        memberData.comped = bundle.inputData.comped;
    }

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
        description: 'Creates a member',
        important: true
    },

    operation: {
        inputFields: [
            {key: 'name', required: false},
            {key: 'email', required: true},
            {key: 'note', required: false},
            {
                key: 'subscribed',
                label: 'Subscribed to newsletter',
                type: 'boolean',
                helpText: 'If disabled, member will not receive newsletter emails',
                required: false
            },
            {
                key: 'labels',
                required: false,
                list: true,
                helpText: 'Provide a list of labels to attach to the member'
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
                helpText: 'If enabled, member will be placed onto a free of charge premium subscription'
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
