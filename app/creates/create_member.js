const {initAdminApi, versionCheck} = require('../lib/utils');

const createMember = async (z, bundle) => {
    // Members was added in Ghost 3.0
    let expectedVersion = '>=3.0.0';
    let action = 'members';
    const memberData = {
        name: bundle.inputData.name,
        email: bundle.inputData.email
    };

    // Member Labels was added in Ghost 3.6
    if (bundle.inputData.labels && bundle.inputData.labels.length > 0) {
        expectedVersion = '>=3.6.0';
        action = 'member labels';
        memberData.labels = bundle.inputData.labels;
    }
    await versionCheck(expectedVersion, action, z, bundle);

    const api = initAdminApi(z, bundle.authData, {version: 'v3'});

    const queryParams = {};

    if (bundle.inputData.send_email) {
        // Zapier sends boolean fields through as yes/no but our API accepts true/false
        queryParams.send_email = bundle.inputData.send_email === 'yes' ? 'true' : 'false';
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
                default: 'yes'
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
            }
        ],

        perform: createMember,

        sample: {
            id: '5c9c9c8d51b5bf974afad2a4',
            name: 'Test Member',
            email: 'test@example.com',
            labels: ['Zapier'],
            created_at: '2019-03-28T10:06:05.862Z',
            updated_at: '2019-03-28T10:06:05.862Z'
        }
    }
};
