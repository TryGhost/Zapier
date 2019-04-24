const authentication = require('./authentication');
const creates = require('./creates');
const searches = require('./searches');
const triggers = require('./triggers');
const resources = require('./resources');

// We can roll up all our behaviors in an App.
const App = {
    // This is just shorthand to reference the installed dependencies you have. Zapier will
    // need to know these before we can upload
    version: require('../package.json').version,
    platformVersion: require('zapier-platform-core').version,

    authentication,

    creates,
    searches,
    triggers,
    resources,

    // beforeRequest & afterResponse are optional hooks into the provided HTTP client
    beforeRequest: [],
    afterResponse: []
};

module.exports = App;
