import zapier from 'zapier-platform-core';

import packageJson from '../package.json' with { type: 'json' };
import authentication from './authentication.js';
import creates from './creates/index.js';
import searches from './searches/index.js';
import triggers from './triggers/index.js';

// We can roll up all our behaviors in an App.
const App = {
    // This is just shorthand to reference the installed dependencies you have. Zapier will
    // need to know these before we can upload
    version: packageJson.version,
    platformVersion: zapier.version,

    authentication,

    creates,
    searches,
    triggers,

    // beforeRequest & afterResponse are optional hooks into the provided HTTP client
    beforeRequest: [],
    afterResponse: [],
};

export default App;
