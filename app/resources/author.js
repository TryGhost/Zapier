const {initAdminApi} = require('../lib/utils');

module.exports = {
    key: 'author',
    noun: 'Author',

    list: {
        display: {
            label: 'List Authors',
            description: 'List all Authors',
            hidden: true
        },

        operation: {
            // called for tags dynamic dropdown
            perform: (z, {authData}) => {
                const api = initAdminApi(authData);

                return api.users.browse({
                    limit: 'all'
                });
            }
        }
    }
};
