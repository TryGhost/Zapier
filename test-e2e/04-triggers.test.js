// Runs against a real Ghost instance - see test-e2e/setup/bootstrap.js
import { describe, it, expect, beforeAll } from 'vitest';

import { App, appTester, getAuthData, fixtures } from './helpers';
import { OWNER } from './setup/bootstrap';

describe('E2E Trigger performLists', function () {
    let authData;

    const performList = (triggerKey) => {
        return appTester(App.triggers[triggerKey].operation.performList, { authData, meta: {} });
    };

    beforeAll(function () {
        authData = getAuthData();
    });

    it('post_published lists the latest published post', async function () {
        const [post] = await performList('post_published');

        expect(post.title).toBe(fixtures.publishedPost.title);
        expect(post.status).toBe('published');
        expect(post.html).toBe(fixtures.publishedPost.html);
    });

    it('post_scheduled lists the latest scheduled post', async function () {
        const [post] = await performList('post_scheduled');

        expect(post.title).toBe(fixtures.scheduledPost.title);
        expect(post.status).toBe('scheduled');
    });

    it('page_published lists the latest published page', async function () {
        // a fresh Ghost install ships with a published "About this site" page
        const [page] = await performList('page_published');

        expect(page.status).toBe('published');
        expect(page.title).toBeTypeOf('string');
    });

    it('member_created lists the latest member', async function () {
        const [member] = await performList('member_created');

        expect(member.email).toBe(fixtures.member.email);
    });

    it('member_updated returns the static sample payload after a version check', async function () {
        const results = await performList('member_updated');

        expect(results).toHaveLength(1);
        expect(results[0]).toBe(App.triggers.member_updated.operation.sample);
    });

    it('member_deleted lists the latest member after a version check', async function () {
        const [member] = await performList('member_deleted');

        expect(member.email).toBe(fixtures.member.email);
    });

    it('newsletter_created lists the default newsletter', async function () {
        const [newsletter] = await performList('newsletter_created');

        expect(newsletter.id).toBeTypeOf('string');
        expect(newsletter.name).toBe(OWNER.blogTitle);
    });

    it('tag_created lists the tag seeded via create_post', async function () {
        const [tag] = await performList('tag_created');

        expect(tag.slug).toBe(fixtures.tagSlug);
    });

    it('tier_created lists the default paid tier and excludes the free tier', async function () {
        const tiers = await performList('tier_created');

        expect(tiers).toHaveLength(1);
        expect(tiers[0].type).toBe('paid');
        expect(tiers[0].name).toBe(OWNER.blogTitle);
    });

    it('author_created lists the owner user', async function () {
        const [author] = await performList('author_created');

        expect(author.email).toBe(OWNER.email);
    });
});
