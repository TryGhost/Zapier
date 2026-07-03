const { initAdminApi, isNotFoundHaltedError } = require('../lib/utils');

const searchMembers = async (z, bundle) => {
    const api = initAdminApi(z, bundle.authData);

    const queryParams = {
        filter: `email:'${bundle.inputData.email}'`,
    };

    try {
        const member = await api.members.browse(queryParams);

        // There's a conflict between Zapier's test conditions, nock responses, and not wanting to double wrap arrays. This was the best solution to satisfy these conditions atm.
        if (Array.isArray(member)) {
            return member;
        }

        return [member];
    } catch (err) {
        if (isNotFoundHaltedError(err)) {
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
        description: 'Search for a member by email address.',
    },

    operation: {
        inputFields: [
            {
                key: 'email',
                type: 'string',
                label: 'Email',
            },
        ],

        perform: searchMembers,

        sample: {
            id: '5a01d3ecc8d50d0e606a7e7c',
            uuid: '42f50516-9d4f-4062-86fe-dc170d2b391c',
            email: 'sample@example.com',
            name: 'Sample Member',
            note: 'Just a sample member record.',
            subscribed: true,
            status: 'free',
            comped: false,
            avatar_image:
                'https://www.gravatar.com/avatar/00000000000000000000000000000000?s=250&r=g&d=blank',
            labels: [
                {
                    id: '5f212d395422021ebc4b7043',
                    name: 'Zapier',
                    slug: 'zapier',
                    created_at: '2019-10-13T18:12:00.000Z',
                    updated_at: '2019-10-13T18:12:00.000Z',
                },
            ],
            newsletters: [
                {
                    id: '62e12664bbd0f0cb56f6f7d1',
                    name: 'Sample Newsletter',
                    description: null,
                    status: 'active',
                },
            ],
            created_at: '2019-10-13T18:12:00.000Z',
            updated_at: '2019-10-13T18:12:00.000Z',
        },
    },
};
