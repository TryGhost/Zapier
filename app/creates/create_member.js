const { initAdminApi } = require('../lib/utils');

const createMember = async (z, bundle) => {
    const memberData = {
        name: bundle.inputData.name,
        email: bundle.inputData.email,
        note: bundle.inputData.note,
    };

    const countSpecified = 'newsletter_count' in bundle.inputData;
    if (countSpecified && bundle.inputData.newsletter_count === 'single') {
        memberData.subscribed = bundle.inputData.subscribed;
    } else if (countSpecified && bundle.inputData.newsletter_count === 'multiple') {
        // Default newsletters is definitely set to false (using !(value !== false) because booleans are sometimes stringified before being set)
        if (
            !(
                'newsletters_default' in bundle.inputData &&
                bundle.inputData.newsletters_default !== false
            )
        ) {
            memberData.newsletters =
                'newsletters' in bundle.inputData
                    ? bundle.inputData.newsletters.map((id) => ({ id }))
                    : [];
        }
    } else {
        // Assume single newsletter for older Zaps
        memberData.subscribed = bundle.inputData.subscribed;
    }

    if (bundle.inputData.labels && bundle.inputData.labels.length > 0) {
        memberData.labels = bundle.inputData.labels;
    }

    // a specific complimentary tier and the deprecated default-tier boolean
    // are mutually exclusive - error rather than guess which one was meant
    if (bundle.inputData.comped_tier && bundle.inputData.comped) {
        throw new z.errors.HaltedError(
            'Use either "Complimentary tier" or the deprecated "Complimentary premium plan", not both.',
        );
    }

    if (bundle.inputData.comped_tier) {
        memberData.tiers = [{ id: bundle.inputData.comped_tier }];
    } else if (bundle.inputData.comped) {
        memberData.comped = bundle.inputData.comped;
    }

    const api = initAdminApi(z, bundle.authData);

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
        description: 'Creates a member.',
    },

    operation: {
        inputFields: [
            { key: 'name', required: false },
            { key: 'email', required: true },
            { key: 'note', required: false },
            {
                key: 'newsletter_count',
                label: 'Number of newsletters',
                required: true,
                choices: {
                    single: 'Single newsletter',
                    multiple: 'Multiple newsletters',
                },
                helpText: 'How many newsletters does your site have?',
                default: 'single',
                altersDynamicFields: true,
            },
            function (z, bundle) {
                if (bundle.inputData.newsletter_count === 'single') {
                    return [
                        {
                            key: 'subscribed',
                            label: 'Subscribe to newsletter',
                            type: 'boolean',
                            helpText: 'If false, member will not be subscribed to emails.',
                            required: false,
                        },
                    ];
                } else if (bundle.inputData.newsletter_count === 'multiple') {
                    return [
                        {
                            key: 'newsletters_default',
                            label: 'Subscribe to default newsletters',
                            type: 'boolean',
                            helpText:
                                'If false, you can subscribe member to specific newsletters or unsubscribe from all.',
                            required: true,
                            default: true,
                            altersDynamicFields: true,
                        },
                    ];
                } else {
                    // Should never happen, but occasionally will be the case on load
                    return [];
                }
            },
            function (z, bundle) {
                // Using value !== false because booleans in Zapier are occasionally strings
                if (
                    bundle.inputData.newsletter_count === 'single' ||
                    bundle.inputData.newsletters_default !== false
                ) {
                    return [];
                } else {
                    return [
                        {
                            key: 'newsletters',
                            label: 'Newsletter subscriptions',
                            helpText: 'Choose which newsletters the member will be subscribed to',
                            required: false,
                            list: true,
                            dynamic: 'newsletter_created.id.name',
                        },
                    ];
                }
            },
            {
                key: 'labels',
                required: false,
                list: true,
                helpText: 'Provide a list of labels to attach to the member',
            },
            {
                key: 'send_email',
                label: 'Send email to member?',
                type: 'boolean',
                default: 'true',
            },
            {
                key: 'email_type',
                label: 'Type of email to send',
                required: false,
                choices: [
                    {
                        value: 'signup',
                        label: 'Signup Confirmation',
                        sample: '"You\'ve successfully signed up"',
                    },
                    { value: 'signin', label: 'Login Link', sample: '"Click here to log in"' },
                    {
                        value: 'subscribe',
                        label: 'Newsletter Subscription',
                        sample: '"Confirm your subscription"',
                    },
                ],
            },
            {
                key: 'comped_tier',
                label: 'Complimentary tier',
                required: false,
                dynamic: 'tier_created.id.name',
                helpText:
                    'Give the member a free of charge subscription to a specific paid tier. Cannot be combined with "Complimentary premium plan".',
            },
            {
                key: 'comped',
                label: 'Complimentary premium plan',
                type: 'boolean',
                helpText:
                    'Deprecated - use "Complimentary tier" instead. If enabled, member will be placed onto a free of charge premium subscription to the default tier. Requires a connected Stripe account.',
            },
        ],

        perform: createMember,

        sample: {
            id: '5c9c9c8d51b5bf974afad2a4',
            uuid: '0f5b95a5-a08b-4e29-b0a0-8dcbc4b7e83f',
            email: 'test@example.com',
            name: 'Test Member',
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
                    created_at: '2019-03-28T10:06:05.862Z',
                    updated_at: '2019-03-28T10:06:05.862Z',
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
            created_at: '2019-03-28T10:06:05.862Z',
            updated_at: '2019-03-28T10:06:05.862Z',
        },
    },
};
