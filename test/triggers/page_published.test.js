require('should');
const nock = require('nock');

const zapier = require('zapier-platform-core');

// Use this to make test calls into your app:
const App = require('../../index');
const appTester = zapier.createAppTester(App);

const samplePage = {
    id: '5c936c15eac9f256dec0bb96',
    uuid: 'ff4563dc-4e95-4e09-b040-84a9c015ea2a',
    title: 'Welcome to Ghost',
    slug: 'welcome',
    mobiledoc: '{"version":"0.3.1","atoms":[],"cards":[],"markups":[["strong"],["a",["href","https://ghost.org/downloads/"]],["a",["href","https://ghost.org/pricing"]],["a",["href","https://github.com/TryGhost"]],["a",["href","/the-editor/"]],["em"]],"sections":[[1,"p",[[0,[],0,"👋 Welcome, it\'s great to have you here."]]],[1,"p",[[0,[],0,"We know that first impressions are important, so we\'ve populated your new site with some initial "],[0,[0],1,"getting started"],[0,[],0," posts that will help you get familiar with everything in no time. This is the first one!"]]],[1,"p",[[0,[0],1,"A few things you should know upfront"],[0,[],0,":"]]],[3,"ol",[[[0,[],0,"Ghost is designed for ambitious, professional publishers who want to actively build a business around their content. That\'s who it works best for. "]],[[0,[],0,"The entire platform can be modified and customised to suit your needs. It\'s very powerful, but does require some knowledge of code. Ghost is not necessarily a good platform for beginners or people who just want a simple personal blog. "]],[[0,[],0,"For the best experience we recommend downloading the "],[0,[1],1,"Ghost Desktop App"],[0,[],0," for your computer, which is the best way to access your Ghost site on a desktop device. "]]]],[1,"p",[[0,[],0,"Ghost is made by an independent non-profit organisation called the Ghost Foundation. We are 100% self funded by revenue from our "],[0,[2],1,"Ghost(Pro)"],[0,[],0," service, and every penny we make is re-invested into funding further development of free, open source technology for modern publishing."]]],[1,"p",[[0,[],0,"The version of Ghost you are looking at right now would not have been made possible without generous contributions from the open source "],[0,[3],1,"community"],[0,[],0,"."]]],[1,"h2",[[0,[],0,"Next up, the editor"]]],[1,"p",[[0,[],0,"The main thing you\'ll want to read about next is probably: "],[0,[4],1,"the Ghost editor"],[0,[],0,". This is where the good stuff happens."]]],[1,"blockquote",[[0,[5],0,"By the way, once you\'re done reading, you can simply delete the default "],[0,[0],1,"Ghost"],[0,[],1," user from your team to remove all of these introductory posts! "]]]]}',
    html: '<p>👋 Welcome, it\'s great to have you here.</p><p>We know that first impressions are important, so we\'ve populated your new site with some initial <strong>getting started</strong> posts that will help you get familiar with everything in no time. This is the first one!</p><p><strong>A few things you should know upfront</strong>:</p><ol><li>Ghost is designed for ambitious, professional publishers who want to actively build a business around their content. That\'s who it works best for. </li><li>The entire platform can be modified and customised to suit your needs. It\'s very powerful, but does require some knowledge of code. Ghost is not necessarily a good platform for beginners or people who just want a simple personal blog. </li><li>For the best experience we recommend downloading the <a href="https://ghost.org/downloads/">Ghost Desktop App</a> for your computer, which is the best way to access your Ghost site on a desktop device. </li></ol><p>Ghost is made by an independent non-profit organisation called the Ghost Foundation. We are 100% self funded by revenue from our <a href="https://ghost.org/pricing">Ghost(Pro)</a> service, and every penny we make is re-invested into funding further development of free, open source technology for modern publishing.</p><p>The version of Ghost you are looking at right now would not have been made possible without generous contributions from the open source <a href="https://github.com/TryGhost">community</a>.</p><h2 id="next-up-the-editor">Next up, the editor</h2><p>The main thing you\'ll want to read about next is probably: <a href="/the-editor/">the Ghost editor</a>. This is where the good stuff happens.</p><blockquote><em>By the way, once you\'re done reading, you can simply delete the default <strong>Ghost</strong> user from your team to remove all of these introductory posts! </em></blockquote>',
    comment_id: '5c936c15eac9f256dec0bb96',
    plaintext: '👋 Welcome, it\'s great to have you here.\n\nWe know that first impressions are important, so we\'ve populated your new site\nwith some initial getting started  posts that will help you get familiar with\neverything in no time. This is the first one!\n\nA few things you should know upfront:\n\n 1. Ghost is designed for ambitious, professional publishers who want to\n    actively build a business around their content. That\'s who it works best\n    for. \n 2. The entire platform can be modified and customised to suit your needs. It\'s\n    very powerful, but does require some knowledge of code. Ghost is not\n    necessarily a good platform for beginners or people who just want a simple\n    personal blog. \n 3. For the best experience we recommend downloading the Ghost Desktop App\n    [https://ghost.org/downloads/]  for your computer, which is the best way to\n    access your Ghost site on a desktop device. \n\nGhost is made by an independent non-profit organisation called the Ghost\nFoundation. We are 100% self funded by revenue from our Ghost(Pro)\n[https://ghost.org/pricing]  service, and every penny we make is re-invested\ninto funding further development of free, open source technology for modern\npublishing.\n\nThe version of Ghost you are looking at right now would not have been made\npossible without generous contributions from the open source community\n[https://github.com/TryGhost].\n\nNext up, the editor\nThe main thing you\'ll want to read about next is probably: the Ghost editor\n[/the-editor/]. This is where the good stuff happens.\n\n> By the way, once you\'re done reading, you can simply delete the default Ghost \nuser from your team to remove all of these introductory posts!',
    feature_image: 'https://static.ghost.org/v2.0.0/images/welcome-to-ghost.jpg',
    featured: false,
    status: 'published',
    meta_title: null,
    meta_description: null,
    created_at: '2019-03-21T10:48:53.000Z',
    updated_at: '2019-04-03T10:27:42.831Z',
    published_at: '2019-03-21T10:48:59.000Z',
    custom_excerpt: 'Welcome, it\'s great to have you here.\nWe know that first impressions are important, so we\'ve populated your new site with some initial getting started posts that will help you get familiar with everything in no time.',
    codeinjection_head: null,
    codeinjection_foot: null,
    og_image: null,
    og_title: null,
    og_description: null,
    twitter_image: null,
    twitter_title: null,
    twitter_description: null,
    custom_template: null,
    canonical_url: null,
    authors: [
        {
            id: '5951f5fca366002ebd5dbef7',
            name: 'Ghost',
            slug: 'ghost',
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
            created_at: '2019-03-21T10:48:53.000Z',
            updated_at: '2019-03-21T10:48:53.000Z',
            roles: [
                {
                    id: '5c936c15eac9f256dec0bb3f',
                    name: 'Author',
                    description: 'Authors',
                    created_at: '2019-03-21T10:48:53.000Z',
                    updated_at: '2019-03-21T10:48:53.000Z'
                }
            ],
            url: 'http://ghost.blog/author/ghost/'
        }
    ],
    tags: [
        {
            id: '5c936c14eac9f256dec0bb38',
            name: 'Getting Started',
            slug: 'getting-started',
            description: 'Testing',
            feature_image: null,
            visibility: 'public',
            meta_title: null,
            meta_description: null,
            created_at: '2019-03-21T10:48:52.000Z',
            updated_at: '2019-04-03T08:48:46.000Z',
            url: 'http://ghost.blog/tag/getting-started/'
        }
    ],
    primary_author: {
        id: '5951f5fca366002ebd5dbef7',
        name: 'Ghost',
        slug: 'ghost',
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
        created_at: '2019-03-21T10:48:53.000Z',
        updated_at: '2019-03-21T10:48:53.000Z',
        roles: [
            {
                id: '5c936c15eac9f256dec0bb3f',
                name: 'Author',
                description: 'Authors',
                created_at: '2019-03-21T10:48:53.000Z',
                updated_at: '2019-03-21T10:48:53.000Z'
            }
        ],
        url: 'http://ghost.blog/author/ghost/'
    },
    primary_tag: {
        id: '5c936c14eac9f256dec0bb38',
        name: 'Getting Started',
        slug: 'getting-started',
        description: 'Testing',
        feature_image: null,
        visibility: 'public',
        meta_title: null,
        meta_description: null,
        created_at: '2019-03-21T10:48:52.000Z',
        updated_at: '2019-04-03T08:48:46.000Z',
        url: 'http://ghost.blog/tag/getting-started/'
    },
    url: 'http://ghost.blog/welcome/',
    excerpt: 'Welcome, it\'s great to have you here.\nWe know that first impressions are important, so we\'ve populated your new site with some initial getting started posts that will help you get familiar with everything in no time.'
};

describe('Triggers', function () {
    describe('Page Published', function () {
        let apiMock, authData;

        beforeEach(function () {
            apiMock = nock('http://zapier-test.ghost.io');
            authData = {
                adminApiUrl: 'http://zapier-test.ghost.io',
                adminApiKey: '5c3e1182e79eace7f58c9c3b:7202e874ccae6f1ee6688bb700f356b672fb078d8465860852652037f7c7459ddbd2f2a6e9aa05a40b499ae20027d9f9ba2e5004aa9ab6510b90a5dac674cbc1'
            };
        });

        afterEach(function () {
            nock.cleanAll();
        });

        it('loads page from webhook data', function () {
            let bundle = Object.assign({}, {authData}, {
                inputData: {},
                cleanedRequest: {
                    page: {
                        current: samplePage,
                        previous: {
                            status: 'draft',
                            updated_at: '2019-04-03T10:27:39.000Z'
                        }
                    }
                }
            });

            return appTester(App.triggers.page_published.operation.perform, bundle)
                .then(([page]) => {
                    page.id.should.eql('5c936c15eac9f256dec0bb96');
                    page.authors.length.should.eql(1, 'no of authors');
                    page.tags.length.should.eql(1, 'no of tags');
                });
        });

        it('loads page from list', function () {
            let bundle = Object.assign({}, {authData}, {
                inputData: {},
                meta: {
                    frontend: true
                }
            });

            apiMock.get('/ghost/api/v2/admin/pages/')
                .query({
                    formats: 'mobiledoc,html,plaintext',
                    filter: 'status:published',
                    order: 'published_at DESC',
                    limit: 1
                })
                .reply(200, {
                    pages: [samplePage],
                    meta: {
                        pagination: {
                            page: 1,
                            limit: 1,
                            pages: 1,
                            total: 1,
                            next: null,
                            prev: null
                        }
                    }
                });

            return appTester(App.triggers.page_published.operation.performList, bundle)
                .then((results) => {
                    apiMock.isDone().should.be.true;
                    results.length.should.eql(1);

                    let [firstPage] = results;
                    firstPage.id.should.eql('5c936c15eac9f256dec0bb96');
                    firstPage.authors.length.should.eql(1, 'no of authors');
                    firstPage.tags.length.should.eql(1, 'no of tags');
                });
        });

        it('subscribes to webhook', function () {
            let bundle = Object.assign({}, {authData}, {
                targetUrl: 'https://webooks.zapier.com/ghost/page_published'
            });

            apiMock.post('/ghost/api/v2/admin/webhooks/', {
                webhooks: [{
                    integration_id: '5c3e1182e79eace7f58c9c3b',
                    target_url: 'https://webooks.zapier.com/ghost/page_published',
                    event: 'page.published'
                }]
            }).reply(201, {
                webhooks: [{
                    id: '12345',
                    target_url: 'https://webooks.zapier.com/ghost/page_published',
                    event: 'page.published'
                }]
            });

            return appTester(App.triggers.page_published.operation.performSubscribe, bundle)
                .then(() => {
                    apiMock.isDone().should.be.true;
                });
        });

        it('unsubscribes from webhook', function () {
            let bundle = Object.assign({}, {authData}, {
                subscribeData: {
                    id: '12345',
                    target_url: 'https://webooks.zapier.com/ghost/page_published',
                    event: 'page.published'
                }
            });

            apiMock.delete('/ghost/api/v2/admin/webhooks/12345/')
                .reply(204);

            return appTester(App.triggers.page_published.operation.performUnsubscribe, bundle)
                .then(() => {
                    apiMock.isDone().should.be.true;
                });
        });
    });
});
