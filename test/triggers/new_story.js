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
                    results.length.should.eql(1);

                    let [post] = results;

                    post.url.should.eql('http://zapier-test.com/sample-post/');
                    post.preview_url.should.eql('http://zapier-test.com/p/353870b6-f38a-4201-bb29-236dae2738f7/');

                    post.html.should.match(/http:\/\/zapier-test\.com\/content\/images\/2017\/11\/NatGeo01\.jpg/);

                    post.feature_image.should.eql('http://zapier-test.com/content/images/2017/11/NatGeo02.jpg');
                    post.og_image.should.eql('http://zapier-test.com/content/images/2017/11/NatGeo04.jpg');
                    post.twitter_image.should.eql('http://zapier-test.com/content/images/2017/11/NatGeo03.jpg');

                    post.author.profile_image.should.eql('http://zapier-test.com/content/images/2017/08/avatar.png');
                    post.author.cover_image.should.eql('http://zapier-test.com/content/images/2017/08/99be792f74310e5ae47955064fdb31fc-1.jpg');

                    post.tags.length.should.eql(3);
                    post.tags[0].url.should.eql('http://zapier-test.com/tag/ghost-tag/');
                    post.tags[0].feature_image.should.eql('http://zapier-test.com/content/images/2017/11/GhostTag.jpg');
                    post.tags[1].url.should.eql('http://zapier-test.com/tag/blogging/');
                    post.tags[1].feature_image.should.eql('http://zapier-test.com/content/images/2017/11/BloggingTag.jpg');
                    post.tags[2].url.should.eql('http://zapier-test.com/tag/markdown/');
                    post.tags[2].feature_image.should.eql('http://zapier-test.com/content/images/2017/11/MarkdownTag.jpg');

                    post.primary_tag.url.should.eql('http://zapier-test.com/tag/ghost-tag/');
                    post.primary_tag.feature_image.should.eql('http://zapier-test.com/content/images/2017/11/GhostTag.jpg');

                    done();
                })
                .catch(done);
        });
    });
});
