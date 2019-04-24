const {initAdminApi} = require('../lib/utils');

module.exports = {
    key: 'tag',
    noun: 'Tag',

    list: {
        display: {
            label: 'List Tags',
            description: 'List all tags',
            hidden: true
        },

        operation: {
            // called for tags dynamic dropdown
            perform: (z, {authData}) => {
                const api = initAdminApi(authData);

                return api.tags.browse({
                    limit: 'all'
                });
            }
        }
    }
};
