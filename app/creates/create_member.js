const {initAdminApi} = require('../lib/utils');

const extractQueryParams = function extractQueryParams(params, inputData) {
    const queryParams = {};
    params.forEach((param) => {
        if (inputData[param]) {
            queryParams[param] = inputData[param];
            delete inputData[param];
        }
    });
    return queryParams;
};

const createMember = (z, bundle) => {
    const api = initAdminApi(z, bundle.authData);
    const queryParams = extractQueryParams(['send_email', 'email_type'], bundle.inputData);

    return api.members.add(bundle.inputData, queryParams).catch((err) => {
        if (err.message.match(/NotFoundError/)) {
            throw new z.errors.HaltedError('Unsupported Ghost version. Minimum version for members support is 2.32.0.');
        }
        throw err;
    });
};

module.exports = {
    key: 'create_member',
    noun: 'Member',

    display: {
        label: 'Create Member',
        description: 'Creates a member (Only supported by Ghost 2.32.0 and later)'
    },

    operation: {
        inputFields: [
            {key: 'name', required: false},
            {key: 'email', required: true},
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
                choices: {
                    signin: 'Signin',
                    signup: 'Signup',
                    subscribe: 'Subscribe'
                }
            }
        ],

        perform: createMember,

        sample: {
            id: '5c9c9c8d51b5bf974afad2a4',
            name: 'Test Member',
            email: 'test@example.com',
            created_at: '2019-03-28T10:06:05.862Z',
            updated_at: '2019-03-28T10:06:05.862Z'
        }
    }
};
