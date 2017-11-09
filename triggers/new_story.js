const _ = require('lodash');

const listPosts = (z, bundle) => {
    let options = {
        url: '/posts/',
        params: {
            status: bundle.inputData.status,
            include: 'author,tags',
            formats: 'mobiledoc,html,plaintext',
            order: 'updated_at desc'
        }
    };

    return z.request(options)
        .then((response) => {
            let blogUrl = bundle.authData.blogUrl.replace(/\/?$/, '');
            let {posts} = z.JSON.parse(response.content);

            // manipulate data so it's useful
            posts.forEach((post) => {
                // add a permalink using the stored blogUrl because the API
                // only returns a relative url
                post.permalink = `${blogUrl}${post.url}`;

                // add a preview url in case this is a draft or scheduled post
                post.preview_url = `${blogUrl}/p/${post.uuid}/`;

                // convert image urls to full URLs
                ['feature_image', 'og_image', 'twitter_image'].forEach((key) => {
                    // check for absolute or protocol-relative URLs
                    if (post[key] && !post[key].match(/^https?:\/\/|\/\//)) {
                        post[key] = `${blogUrl}${post[key]}`;
                    }
                });
            });

            return posts;
        });
};

module.exports = {
    key: 'new_story',
    noun: 'Story',

    display: {
        label: 'New Story',
        description: 'Triggered when a new story is added.'
    },

    operation: {
        inputFields: [
            {
                key: 'status',
                type: 'string',
                helpText: 'Which status this should trigger on.',
                required: true,
                default: 'published',
                choices: {
                    all: 'All',
                    published: 'Published',
                    scheduled: 'Scheduled',
                    draft: 'Draft'
                }
            }
        ],

        perform: listPosts,

        // the sample should be returned as if it's been through the same
        // manipulation that `listPosts` does
        sample: {
            id: '5a032270d7d07547c8982aa8',
            uuid: 'e7975bae-58b2-4632-9f56-d9f8ded39905',
            title: 'Sample Post',
            slug: 'sample-post',
            html: '<div class="kg-card-markdown"><p>Sample post that has just been published, has a couple of tags and meta data.</p>\n<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas varius risus quis tincidunt sodales. Etiam posuere, augue vitae dignissim ultrices, nisl diam maximus lacus, sed mollis tellus libero eget dui. Fusce eget eros lacus. Ut lobortis augue sed magna cursus, et ultricies odio interdum. Proin sed libero enim. Nunc ac interdum ex. Sed at mauris purus. Integer     eget dignissim eros. Cras vel dui malesuada, semper massa in, laoreet nulla. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>\n<p>Nulla a lorem eget turpis tincidunt luctus. Cras malesuada sed tellus ac auctor. Suspendisse nec ornare odio, et pellentesque orci. Cras eget suscipit tortor. Curabitur a orci bibendum, viverra odio et, ullamcorper nisl. Ut non lobortis leo. Duis leo ante, eleifend porta nunc at, tincidunt facilisis metus. Aliquam feugiat id leo ac vehicula. Nullam sed    nunc ornare, interdum ipsum vitae, elementum sem. Sed iaculis, nunc non vehicula commodo, enim ex mollis lorem, et tincidunt magna risus sed massa. Aenean quis varius odio. Sed at metus tincidunt, posuere tellus eu, fermentum magna. Fusce blandit rhoncus arcu, a pharetra tortor tristique a. Vivamus finibus non orci vel hendrerit.</p>\n</div>',
            feature_image: 'https://images.unsplash.com/photo-1510022151265-1bb84d406531?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max&s=bb705e8a157ef7343a8af61b4ce3a565',
            featured: false,
            page: false,
            status: 'published',
            locale: null,
            visibility: 'public',
            meta_title: 'Sample Post Meta Title',
            meta_description: 'Meta description for our sample post that\'s used for testing integrations.',
            created_at: '2017-11-08T15:27:44.000Z',
            created_by: '1',
            updated_at: '2017-11-08T15:36:16.000Z',
            updated_by: '1',
            published_at: '2017-11-08T15:36:16.000Z',
            published_by: '1',
            custom_excerpt: 'Custom excerpt for the sample post.',
            codeinjection_head: '',
            codeinjection_foot: '',
            og_image: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max&s=e1072d4cad32ab213550ff148c73d6c6',
            og_title: 'Custom Facebook title for Sample Post',
            og_description: 'Custom description used for Facebook embeds of Sample Post.',
            twitter_image: 'https://images.unsplash.com/photo-1470786838951-8f10f0c86b78?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max&s=cd29acf3dce4e4a6f7daae59eeb86b86',
            twitter_title: 'Custom Twitter Title for Sample Post',
            twitter_description: 'Custom description used for Twitter embeds of the Sample Post',
            custom_template: null,
            author: {
                id: '1',
                name: 'Kevin Ansfield',
                slug: 'kevin',
                profile_image: '//www.gravatar.com/avatar/3ae045bc198a157401827c8455cd7c99?s=250&d=mm&r=x',
                cover_image: null,
                bio: null,
                website: null,
                location: null,
                facebook: null,
                twitter: null,
                accessibility: '{"nightShift":false}',
                locale: null,
                visibility: 'public',
                meta_title: null,
                meta_description: null,
                tour: '["getting-started","using-the-editor","static-post","featured-post","upload-a-theme"]'
            },
            tags: [
                {
                    id: '5a0322f9d7d07547c8982aa9',
                    name: 'Technology',
                    slug: 'technology',
                    description: null,
                    feature_image: null,
                    visibility: 'public',
                    meta_title: null,
                    meta_description: null,
                    created_at: '2017-11-08T15:30:01.000Z',
                    created_by: '1',
                    updated_at: '2017-11-08T15:30:01.000Z',
                    updated_by: '1',
                    parent: null
                },
                {
                    id: '5a0322f9d7d07547c8982aab',
                    name: 'Integration',
                    slug: 'integration',
                    description: null,
                    feature_image: null,
                    visibility: 'public',
                    meta_title: null,
                    meta_description: null,
                    created_at: '2017-11-08T15:30:01.000Z',
                    created_by: '1',
                    updated_at: '2017-11-08T15:30:01.000Z',
                    updated_by: '1',
                    parent: null
                },
                {
                    id: '5a0322f9d7d07547c8982aad',
                    name: '#Sample',
                    slug: 'hash-sample',
                    description: null,
                    feature_image: null,
                    visibility: 'internal',
                    meta_title: null,
                    meta_description: null,
                    created_at: '2017-11-08T15:30:01.000Z',
                    created_by: '1',
                    updated_at: '2017-11-08T15:30:01.000Z',
                    updated_by: '1',
                    parent: null
                }
            ],
            primary_tag: {
                id: '5a0322f9d7d07547c8982aa9',
                name: 'Technology',
                slug: 'technology',
                description: null,
                feature_image: null,
                visibility: 'public',
                meta_title: null,
                meta_description: null,
                created_at: '2017-11-08T15:30:01.000Z',
                created_by: '1',
                updated_at: '2017-11-08T15:30:01.000Z',
                updated_by: '1',
                parent: null
            },
            url: '/sample-post/',
            comment_id: '5a032270d7d07547c8982aa8',

            // added via getPosts
            permalink: 'https://example.com/sample-post/',
            preview_url: 'https://example.com/p/e7975bae-58b2-4632-9f56-d9f8ded39905/'
        },

        outputFields: [
            {key: 'permalink', label: 'Published post URL'},
            {key: 'published_at', label: 'Publish Date (UTC)'},
            {key: 'updated_at', label: 'Last Updated Date (UTC)'},
            {key: 'html', label: 'HTML Formatted Content'},
            {key: 'mobiledoc', label: 'Raw Mobiledoc Content'},
            {key: 'plaintext', label: 'Plain Text Formatted Content'},
            {key: 'og_image', label: 'Open Graph Image'},
            {key: 'og_title', label: 'Open Graph Title'},
            {key: 'og_description', label: 'Open Graph Description'},
            {key: 'twitter_image', label: 'Twitter Embed Image'},
            {key: 'twitter_title', label: 'Twitter Embed Title'},
            {key: 'twitter_description', label: 'Twitter Embed Description'},
        ]
    }
};
