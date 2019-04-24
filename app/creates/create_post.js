const {initAdminApi} = require('../lib/utils');

const createPost = (z, {inputData, authData}) => {
    const api = initAdminApi(z, authData);
    const queryParams = {};

    // convert list of slug strings into minimal tag/author objects so that the
    // API can perform lookups
    const tagSlugs = inputData.tags;
    const authorSlugs = inputData.authors;

    inputData.tags = tagSlugs.map((slug) => {
        return {slug};
    });

    inputData.authors = authorSlugs.map((slug) => {
        return {slug};
    });

    // ensure we're supplying the right input format
    if (inputData.input_format === 'html') {
        delete inputData.mobiledoc;
        queryParams.source = 'html';
    } else {
        delete inputData.html;
    }
    delete inputData.input_format;

    return api.posts.add(inputData, queryParams);
};

module.exports = {
    key: 'create_post',
    noun: 'Post',

    display: {
        label: 'Create Post',
        description: 'Creates a post.'
    },

    operation: {
        inputFields: [
            {key: 'title', required: true},
            {key: 'slug', required: false},
            {
                key: 'status',
                required: true,
                choices: {
                    draft: 'Draft',
                    published: 'Published',
                    scheduled: 'Scheduled'
                },
                default: 'draft',
                altersDynamicFields: true
            },
            // make sure the published date is required if the post is to be scheduled
            function (z, bundle) {
                if (bundle.inputData.status === 'scheduled') {
                    return [{key: 'published_at', required: true, type: 'datetime'}];
                } else {
                    return [{key: 'published_at', required: false, type: 'datetime'}];
                }
            },
            {
                key: 'input_format',
                required: true,
                choices: {
                    mobiledoc: 'Mobiledoc',
                    html: 'HTML'
                },
                default: 'mobiledoc',
                altersDynamicFields: true
            },
            // only show a single content field based on the selected input format
            // to avoid any confusion over which one has precedence at the API level
            function (z, bundle) {
                if (bundle.inputData.input_format === 'mobiledoc') {
                    return [{key: 'mobiledoc', required: false, type: 'text'}];
                } else {
                    return [{key: 'html', required: false, type: 'text'}];
                }
            },
            {key: 'custom_excerpt', required: false, type: 'text'},
            {key: 'feature_image', required: false},
            {
                key: 'tags',
                helpText: 'Provide a list of tag slugs to attach to the post',
                required: false,
                list: true
            },
            {
                key: 'authors',
                helpText: 'Provide a list of author slugs',
                required: true,
                list: true
            },
            {key: 'featured', required: false, type: 'boolean'},
            {key: 'canonical_url', required: false},
            {key: 'meta_title', required: false},
            {key: 'meta_description', required: false, type: 'text'},
            {key: 'og_title', required: false},
            {key: 'og_description', required: false, type: 'text'},
            {key: 'og_image', required: false},
            {key: 'twitter_title', required: false},
            {key: 'twitter_description', required: false, type: 'text'},
            {key: 'twitter_image', required: false},
            {key: 'codeinjection_head', required: false, type: 'text'},
            {key: 'codeinjection_foot', required: false, type: 'text'}
        ],

        perform: createPost,

        sample: {
            id: '5c34ce2370401002b874c585',
            uuid: '472cd89d-953c-42ad-ae18-974b35444d03',
            title: 'Data schema',
            slug: 'data-schema',
            mobiledoc: '{"version":"0.3.1","atoms":[],"cards":[],"markups":[],"sections":[[1,"p",[[0,[],0,"This is a data schema stub for Gatsby.js and is not used. It must exist for builds to function"]]]]}',
            comment_id: '5bb75b5a37361dae192eff1b',
            feature_image: 'https://images.unsplash.com/photo-1532630571098-79a3d222b00d?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max&ixid=eyJhcHBfaWQiOjExNzczfQ&s=a88235003c40468403f936719134519d',
            featured: true,
            status: 'published',
            meta_title: 'Data schema',
            meta_description: 'This is a data schema stub for Gatsby.js and is not used. It must exist for builds to function',
            created_at: '2000-01-01T00:00:01.000Z',
            updated_at: '2018-10-08T06:38:11.000Z',
            published_at: '2000-01-01T00:00:01.000Z',
            custom_excerpt: 'This is a data schema stub for Gatsby.js and is not used. It must exist for builds to function',
            codeinjection_head: '.some-class {\n}',
            codeinjection_foot: '.some-class {\n}',
            og_image: 'https://images.unsplash.com/photo-1532630571098-79a3d222b00d?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max&ixid=eyJhcHBfaWQiOjExNzczfQ&s=a88235003c40468403f936719134519d',
            og_title: 'Data schema',
            og_description: 'This is a data schema stub for Gatsby.js and is not used. It must exist for builds to function',
            twitter_image: 'https://images.unsplash.com/photo-1532630571098-79a3d222b00d?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max&ixid=eyJhcHBfaWQiOjExNzczfQ&s=a88235003c40468403f936719134519d',
            twitter_title: 'Data schema',
            twitter_description: 'This is a data schema stub for Gatsby.js and is not used. It must exist for builds to function',
            custom_template: 'post.hbs',
            canonical_url: null,
            tags: [
                {
                    id: '5c34ce2370401002b874c584',
                    name: 'Data schema',
                    slug: 'data-schema',
                    description: 'This is a data schema stub for Gatsby.js and is not used. It must exist for builds to function',
                    feature_image: 'https://images.unsplash.com/photo-1532630571098-79a3d222b00d?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max&ixid=eyJhcHBfaWQiOjExNzczfQ&s=a88235003c40468403f936719134519d',
                    visibility: 'public',
                    meta_title: 'Data schema',
                    meta_description: 'This is a data schema stub for Gatsby.js and is not used. It must exist for builds to function',
                    created_at: '2018-10-08T06:37:38.000Z',
                    updated_at: '2018-10-08T06:37:38.000Z',
                    url: 'http://localhost:2368/tag/data-schema/'
                },
                {
                    id: '5c34ce2370401002b874c583',
                    name: 'Data schema primary',
                    slug: 'data-schema-primary',
                    description: 'This is a data schema stub for Gatsby.js and is not used. It must exist for builds to function',
                    feature_image: 'https://images.unsplash.com/photo-1532630571098-79a3d222b00d?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max&ixid=eyJhcHBfaWQiOjExNzczfQ&s=a88235003c40468403f936719134519d',
                    visibility: 'public',
                    meta_title: 'Data schema primary',
                    meta_description: 'This is a data schema stub for Gatsby.js and is not used. It must exist for builds to function',
                    created_at: '2018-10-08T06:36:13.000Z',
                    updated_at: '2018-10-08T06:36:13.000Z',
                    url: 'http://localhost:2368/tag/data-schema-primary/'
                }
            ],
            authors: [
                {
                    id: '5c34ce2370401002b874c581',
                    name: 'Data Schema Author',
                    slug: 'data-schema-author',
                    email: 'data-schema@example.com',
                    profile_image: 'https://casper.ghost.org/v2.0.0/images/ghost.png',
                    cover_image: 'https://images.unsplash.com/photo-1532630571098-79a3d222b00d?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max&ixid=eyJhcHBfaWQiOjExNzczfQ&s=a88235003c40468403f936719134519d',
                    bio: 'This is a data schema stub for Gatsby.js and is not used. It must exist for builds to function',
                    website: 'https://ghost.org',
                    location: 'The Internet',
                    facebook: 'ghost',
                    twitter: '@tryghost',
                    accessibility: null,
                    status: 'locked',
                    meta_title: 'Data Schema Author',
                    meta_description: 'This is a data schema stub for Gatsby.js and is not used. It must exist for builds to function',
                    tour: null,
                    last_seen: null,
                    created_at: '2000-01-01T00:00:01.000Z',
                    updated_at: '2000-01-01T00:00:01.000Z',
                    roles: [
                        {
                            id: '5c34b884ba522a02712f01ef',
                            name: 'Author',
                            description: 'Authors',
                            created_at: '2019-01-08T14:49:40.000Z',
                            updated_at: '2019-01-08T14:49:40.000Z'
                        }
                    ],
                    url: 'http://localhost:2368/author/data-schema-author/'
                },
                {
                    id: '1',
                    name: 'Kevin Ansfield',
                    slug: 'kevin',
                    email: 'kevin@ghost.org',
                    profile_image: '//www.gravatar.com/avatar/3ae045bc198a157401827c8455cd7c99?s=250&d=mm&r=x',
                    cover_image: null,
                    bio: null,
                    website: null,
                    location: null,
                    facebook: null,
                    twitter: null,
                    accessibility: null,
                    status: 'active',
                    meta_title: null,
                    meta_description: null,
                    tour: '["getting-started","using-the-editor","static-post","featured-post","upload-a-theme"]',
                    last_seen: '2019-04-24T07:39:27.000Z',
                    created_at: '2019-01-08T14:49:40.000Z',
                    updated_at: '2019-04-24T07:39:27.000Z',
                    roles: [
                        {
                            id: '5c34b884ba522a02712f01f1',
                            name: 'Owner',
                            description: 'Blog Owner',
                            created_at: '2019-01-08T14:49:40.000Z',
                            updated_at: '2019-01-08T14:49:40.000Z'
                        }
                    ],
                    url: 'http://localhost:2368/author/kevin/'
                }
            ],
            primary_author: {
                id: '5c34ce2370401002b874c581',
                name: 'Data Schema Author',
                slug: 'data-schema-author',
                email: 'data-schema@example.com',
                profile_image: 'https://casper.ghost.org/v2.0.0/images/ghost.png',
                cover_image: 'https://images.unsplash.com/photo-1532630571098-79a3d222b00d?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max&ixid=eyJhcHBfaWQiOjExNzczfQ&s=a88235003c40468403f936719134519d',
                bio: 'This is a data schema stub for Gatsby.js and is not used. It must exist for builds to function',
                website: 'https://ghost.org',
                location: 'The Internet',
                facebook: 'ghost',
                twitter: '@tryghost',
                accessibility: null,
                status: 'locked',
                meta_title: 'Data Schema Author',
                meta_description: 'This is a data schema stub for Gatsby.js and is not used. It must exist for builds to function',
                tour: null,
                last_seen: null,
                created_at: '2000-01-01T00:00:01.000Z',
                updated_at: '2000-01-01T00:00:01.000Z',
                roles: [
                    {
                        id: '5c34b884ba522a02712f01ef',
                        name: 'Author',
                        description: 'Authors',
                        created_at: '2019-01-08T14:49:40.000Z',
                        updated_at: '2019-01-08T14:49:40.000Z'
                    }
                ],
                url: 'http://localhost:2368/author/data-schema-author/'
            },
            primary_tag: {
                id: '5c34ce2370401002b874c584',
                name: 'Data schema',
                slug: 'data-schema',
                description: 'This is a data schema stub for Gatsby.js and is not used. It must exist for builds to function',
                feature_image: 'https://images.unsplash.com/photo-1532630571098-79a3d222b00d?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max&ixid=eyJhcHBfaWQiOjExNzczfQ&s=a88235003c40468403f936719134519d',
                visibility: 'public',
                meta_title: 'Data schema',
                meta_description: 'This is a data schema stub for Gatsby.js and is not used. It must exist for builds to function',
                created_at: '2018-10-08T06:37:38.000Z',
                updated_at: '2018-10-08T06:37:38.000Z',
                url: 'http://localhost:2368/tag/data-schema/'
            },
            url: 'http://localhost:2368/data-schema/',
            excerpt: 'This is a data schema stub for Gatsby.js and is not used. It must exist for builds to function'
        }
    }
};
