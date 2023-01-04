const {initAdminApi, versionCheck} = require('../lib/utils');

const searchMembers = async (z, bundle) => {
    const api = initAdminApi(z, bundle.authData, {version: 'v3'});
    const requiredVersion = '>=3.0.0';

    await versionCheck(requiredVersion, 'member search', z, bundle);

    const queryParams = {
        filter: `email:'${bundle.inputData.email}'`
    };

    try {
        const member = await api.members.browse(queryParams);

        // There's a conflict between Zapier's test conditions, nock responses, and not wanting to double wrap arrays. This was the best solution to satisfy these conditions atm.
        if (Array.isArray(member)) {
            return member;
        }
        
        return [member];
    } catch (err) {
        if (err.name === 'HaltedError' && err.message.match(/404/)) {
            return [];
        }

        throw err;
    }
};

module.exports = {
    key: 'member',
    noun: 'Member',

    display: {
        label: 'Find a Member',
        description: 'Search for a member by email address.'
    },

    operation: {
        inputFields: [{
            key: 'email',
            type: 'string',
            label: 'Email'
        }],

        perform: searchMembers,

        sample: {
            id: '5a01d3ecc8d50d0e606a7e7c',
            name: 'Sample Member',
            email: 'sample@example.com',
            note: 'Just a sample member record.',
            subscribed: true,
            comped: false,
            labels: [
                {
                    name: 'Zapier',
                    slug: 'zapier',
                    created_at: '2019-10-13T18:12:00.000Z',
                    updated_at: '2019-10-13T18:12:00.000Z'
                }
            ],
            created_at: '2019-10-13T18:12:00.000Z',
            updated_at: '2019-10-13T18:12:00.000Z'
        }
    }
};
