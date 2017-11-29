const nock = require('nock');
const should = require('should');

const zapier = require('zapier-platform-core');

// Use this to make test calls into your app:
const App = require('../../index');
const appTester = zapier.createAppTester(App);

describe('Triggers', () => {
    describe('New Story', () => {
        let apiMock = nock('http://zapier-test.ghost.io');
        let authData = {
            adminUrl: 'http://zapier-test.ghost.io/ghost/',
            blogUrl: 'http://zapier-test.com/',
            email: 'test@ghost.org',
            password: 'iamsupersecure'
        };

        afterEach(() => {
            nock.cleanAll();
        });

        it('converts relative URLs to absolute URLs', function (done) {
            let bundle = Object.assign({}, {authData}, {
                inputData: {
                    status: 'all'
                }
            });

            apiMock.get('/ghost/api/v0.1/posts/')
                .query({
                    status: 'all',
                    include: 'author,tags',
                    formats: 'mobiledoc,html,plaintext',
                    order: 'updated_at desc'
                })
                .replyWithFile(200,
                    __dirname + '/replies/posts.json',
                    {'Content-Type': 'application/json'}
                );

            appTester(App.triggers.new_story.operation.perform, bundle)
                .then((results) => {
                    apiMock.isDone().should.be.true;
                    results.length.should.eql(2);

                    let [post1, post2] = results;

                    post1.url.should.eql('http://zapier-test.com/sample-post/');
                    post1.preview_url.should.eql('http://zapier-test.com/p/353870b6-f38a-4201-bb29-236dae2738f7/');

                    post1.html.should.match(/http:\/\/zapier-test\.com\/content\/images\/2017\/11\/NatGeo01\.jpg/);

                    post1.feature_image.should.eql('http://zapier-test.com/content/images/2017/11/NatGeo02.jpg');
                    post1.og_image.should.eql('http://zapier-test.com/content/images/2017/11/NatGeo04.jpg');
                    post1.twitter_image.should.eql('http://zapier-test.com/content/images/2017/11/NatGeo03.jpg');

                    post1.author.url.should.eql('http://zapier-test.com/author/kevin/');
                    post1.author.profile_image.should.eql('http://zapier-test.com/content/images/2017/08/avatar.png');
                    post1.author.cover_image.should.eql('http://zapier-test.com/content/images/2017/08/99be792f74310e5ae47955064fdb31fc-1.jpg');

                    post1.tags.length.should.eql(3);
                    post1.tags[0].url.should.eql('http://zapier-test.com/tag/ghost-tag/');
                    post1.tags[0].feature_image.should.eql('http://zapier-test.com/content/images/2017/11/GhostTag.jpg');
                    post1.tags[1].url.should.eql('http://zapier-test.com/tag/blogging/');
                    post1.tags[1].feature_image.should.eql('http://zapier-test.com/content/images/2017/11/BloggingTag.jpg');
                    post1.tags[2].url.should.eql('http://zapier-test.com/tag/markdown/');
                    post1.tags[2].feature_image.should.eql('http://zapier-test.com/content/images/2017/11/MarkdownTag.jpg');

                    post1.primary_tag.url.should.eql('http://zapier-test.com/tag/ghost-tag/');
                    post1.primary_tag.feature_image.should.eql('http://zapier-test.com/content/images/2017/11/GhostTag.jpg');

                    // ---

                    post2.url.should.eql('http://example.com/sample-post/');
                    post2.preview_url.should.eql('http://example.com/p/353870b6-f38a-4201-bb29-236dae2738f7/');

                    post2.html.should.match(/http:\/\/example\.com\/content\/images\/2017\/11\/NatGeo01\.jpg/);

                    post2.feature_image.should.eql('http://example.com/content/images/2017/11/NatGeo02.jpg');
                    post2.og_image.should.eql('http://example.com/content/images/2017/11/NatGeo04.jpg');
                    post2.twitter_image.should.eql('http://example.com/content/images/2017/11/NatGeo03.jpg');

                    post2.author.url.should.eql('http://example.com/author/kevin/');
                    post2.author.profile_image.should.eql('http://example.com/content/images/2017/08/avatar.png');
                    post2.author.cover_image.should.eql('http://example.com/content/images/2017/08/99be792f74310e5ae47955064fdb31fc-1.jpg');

                    post2.tags.length.should.eql(3);
                    post2.tags[0].url.should.eql('http://example.com/tag/ghost-tag/');
                    post2.tags[0].feature_image.should.eql('http://example.com/content/images/2017/11/GhostTag.jpg');
                    post2.tags[1].url.should.eql('http://example.com/tag/blogging/');
                    post2.tags[1].feature_image.should.eql('http://example.com/content/images/2017/11/BloggingTag.jpg');
                    post2.tags[2].url.should.eql('http://example.com/tag/markdown/');
                    post2.tags[2].feature_image.should.eql('http://example.com/content/images/2017/11/MarkdownTag.jpg');

                    post2.primary_tag.url.should.eql('http://example.com/tag/ghost-tag/');
                    post2.primary_tag.feature_image.should.eql('http://example.com/content/images/2017/11/GhostTag.jpg');

                    done();
                })
                .catch(done);
        });
    });
});
