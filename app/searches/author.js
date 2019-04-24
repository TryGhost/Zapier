const {initAdminApi} = require('../lib/utils');

const searchAuthors = (z, {inputData, authData}) => {
    const api = initAdminApi(z, authData);

    // remove the input field which isn't the selected search type so the
    // sdk generates the correct URL
    if (inputData.search_by === 'slug') {
        delete inputData.email;
    }
    if (inputData.search_by === 'email') {
        delete inputData.slug;
    }

    // remove input field that is only used to select the search type
    delete inputData.search_by;

    return api.users.read(inputData).then((author) => {
        return [author];
    }).catch((err) => {
        // we throw a HaltedError on a 404 so we return an empty array
        // to satisfy the `search` action return type
        if (err.name === 'HaltedError' && err.message.match(/404/)) {
            return [];
        }

        throw err;
    });
};

module.exports = {
    key: 'author',
    noun: 'Author',

    display: {
        label: 'Find an Author',
        description: 'Search for an author by email address or slug.'
    },

    operation: {
        inputFields: [
            {
                key: 'search_by',
                required: true,
                choices: {
                    email: 'Email address',
                    slug: 'Slug'
                },
                default: 'email',
                altersDynamicFields: true
            },
            function (z, {inputData}) {
                if (inputData.search_by === 'email') {
                    return [{key: 'email', label: 'Email address', required: true, type: 'text'}];
                } else {
                    return [{key: 'slug', required: true, type: 'text'}];
                }
            }
        ],

        perform: searchAuthors,

        sample: {
            slug: 'ghost',
            id: '5951f5fca366002ebd5dbef7',
            name: 'Ghost',
            email: 'ghost-author@example.com',
            profile_image: 'https://static.ghost.org/v2.0.0/images/ghost.png',
            cover_image: null,
            bio: 'You can delete this user to remove all the welcome posts',
            website: 'https://ghost.org',
            location: 'The Internet',
            facebook: 'ghost',
            twitter: 'tryghost',
            accessibility: null,
            status: 'active',
            meta_title: null,
            meta_description: null,
            tour: null,
            last_seen: null,
            created_at: '2019-01-08T14:49:40.000Z',
            updated_at: '2019-01-08T14:49:40.000Z',
            url: 'http://localhost:2368/author/ghost/'
        }
    }
};
