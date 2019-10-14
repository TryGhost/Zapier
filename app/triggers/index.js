module.exports = {
    author_created: require('./author_created'),
    member_created: require('./member_created'),
    // TODO: re-enable once member deletion webhook payloads are working in Ghost core
    // member_deleted: require('./member_deleted'),
    page_published: require('./page_published'),
    post_published: require('./post_published'),
    subscriber_created: require('./subscriber_created'),
    subscriber_deleted: require('./subscriber_deleted'),
    tag_created: require('./tag_created')
};
