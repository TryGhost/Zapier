// Runs against a real Ghost instance - see test-e2e/setup/bootstrap.js
require('should');

const {App, appTester, getAuthData, fixtures} = require('./helpers');
const {OWNER} = require('./setup/bootstrap');

describe('E2E Trigger performLists', function () {
    let authData;

    const performList = (triggerKey) => {
        return appTester(App.triggers[triggerKey].operation.performList, {authData, meta: {}});
    };

    before(function () {
        authData = getAuthData();
    });

    it('post_published lists the latest published post', async function () {
        const [post] = await performList('post_published');

        post.title.should.equal(fixtures.publishedPost.title);
        post.status.should.equal('published');
        post.html.should.equal(fixtures.publishedPost.html);
    });

    it('post_scheduled lists the latest scheduled post', async function () {
        const [post] = await performList('post_scheduled');

        post.title.should.equal(fixtures.scheduledPost.title);
        post.status.should.equal('scheduled');
    });

    it('page_published lists the latest published page', async function () {
        // a fresh Ghost install ships with a published "About this site" page
        const [page] = await performList('page_published');

        page.status.should.equal('published');
        page.title.should.be.a.String();
    });

    it('member_created lists the latest member', async function () {
        const [member] = await performList('member_created');

        member.email.should.equal(fixtures.member.email);
    });

    it('member_updated returns the static sample payload after a version check', async function () {
        const results = await performList('member_updated');

        results.should.have.length(1);
        results[0].should.equal(App.triggers.member_updated.operation.sample);
    });

    it('member_deleted lists the latest member after a version check', async function () {
        const [member] = await performList('member_deleted');

        member.email.should.equal(fixtures.member.email);
    });

    it('newsletter_created lists the default newsletter', async function () {
        const [newsletter] = await performList('newsletter_created');

        newsletter.id.should.be.a.String();
        newsletter.name.should.equal(OWNER.blogTitle);
    });

    it('tag_created lists the tag seeded via create_post', async function () {
        const [tag] = await performList('tag_created');

        tag.slug.should.equal(fixtures.tagSlug);
    });

    it('author_created lists the owner user', async function () {
        const [author] = await performList('author_created');

        author.email.should.equal(OWNER.email);
    });
});
