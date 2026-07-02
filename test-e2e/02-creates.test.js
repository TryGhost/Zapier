// Runs against a real Ghost instance - see test-e2e/setup/bootstrap.js
require('should');

const {App, appTester, getAuthData, fixtures} = require('./helpers');
const {OWNER} = require('./setup/bootstrap');

describe('E2E Creates', function () {
    let authData;

    before(function () {
        authData = getAuthData();
    });

    describe('Create Member', function () {
        it('creates a member without sending an email', async function () {
            const member = await appTester(App.creates.create_member.operation.perform, {
                authData,
                inputData: {
                    name: fixtures.member.name,
                    email: fixtures.member.email,
                    note: fixtures.member.note,
                    newsletter_count: 'single',
                    subscribed: true,
                    // no mail transport is configured in CI, sending must stay off
                    send_email: false
                }
            });

            member.id.should.be.a.String();
            member.email.should.equal(fixtures.member.email);
            member.name.should.equal(fixtures.member.name);
        });
    });

    describe('Update Member', function () {
        it('updates the member with explicit newsletter subscriptions', async function () {
            // the default newsletter every Ghost 5 site ships with
            const [newsletter] = await appTester(App.triggers.newsletter_created.operation.performList, {
                authData,
                meta: {}
            });
            newsletter.id.should.be.a.String();

            const [member] = await appTester(App.searches.member.operation.perform, {
                authData,
                inputData: {email: fixtures.member.email}
            });

            const updated = await appTester(App.creates.update_member.operation.perform, {
                authData,
                inputData: {
                    id: member.id,
                    name: `${fixtures.member.name} Updated`,
                    newsletter_count: 'multiple',
                    newsletters_keepsame: false,
                    newsletters: [newsletter.id]
                }
            });

            updated.id.should.equal(member.id);
            updated.name.should.equal(`${fixtures.member.name} Updated`);
            updated.newsletters.should.have.length(1);
            updated.newsletters[0].id.should.equal(newsletter.id);
        });
    });

    describe('Create Post', function () {
        let ownerSlug;

        before(async function () {
            // the author input takes slugs - resolve the owner's real slug
            // rather than guessing what Ghost generated from the name
            const [owner] = await appTester(App.searches.author.operation.perform, {
                authData,
                inputData: {search_by: 'email', email: OWNER.email}
            });
            ownerSlug = owner.slug;
        });

        it('creates a published post from html source with a new tag', async function () {
            const post = await appTester(App.creates.create_post.operation.perform, {
                authData,
                inputData: {
                    title: fixtures.publishedPost.title,
                    status: 'published',
                    content_format: 'html',
                    html: fixtures.publishedPost.html,
                    tags: [fixtures.tagSlug],
                    authors: [ownerSlug]
                }
            });

            post.id.should.be.a.String();
            post.title.should.equal(fixtures.publishedPost.title);
            post.status.should.equal('published');
            post.tags.should.have.length(1);
            post.tags[0].slug.should.equal(fixtures.tagSlug);
            post.primary_author.slug.should.equal(ownerSlug);
        });

        it('creates a scheduled post with a future publish date', async function () {
            const oneHourAhead = new Date(Date.now() + (60 * 60 * 1000)).toISOString();

            const post = await appTester(App.creates.create_post.operation.perform, {
                authData,
                inputData: {
                    title: fixtures.scheduledPost.title,
                    status: 'scheduled',
                    published_at: oneHourAhead,
                    content_format: 'html',
                    html: fixtures.scheduledPost.html,
                    authors: [ownerSlug]
                }
            });

            post.status.should.equal('scheduled');
            post.title.should.equal(fixtures.scheduledPost.title);
        });
    });
});
