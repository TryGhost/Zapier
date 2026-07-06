## 3.0.0

Breaking changes:

* (Breaking) Requires Ghost 6.0 or later to connect. Zaps created on earlier
  integration versions keep working against older Ghost sites; maintenance
  releases for those users ship from the `2.x` branch.
* (Breaking) Removed the deprecated "subscriber" triggers, search, and actions
  (Create/Delete Subscriber, Subscriber Created/Deleted). The underlying API
  was removed in Ghost 3.0 — these operations were hidden and only ever
  returned an error.
* (Breaking) The integration now runs on Zapier's Node 22 runtime via
  zapier-platform-core 19 (previously Node 14 / core 12).
* (Breaking) All requests target the unversioned Admin API
  (`/ghost/api/admin/`) with an `Accept-Version: v6.0` header instead of the
  legacy `/v2/`/`/v3/` paths.

New:

* (New) Comp members into a specific tier: "Complimentary tier" dropdown on
  Create Member and Update Member (sends `tiers`), plus a "Remove
  complimentary subscription" option on Update Member. The legacy
  "Complimentary premium plan" boolean keeps working (default tier only).
* (New) Clearer Member field help on Update Member and realistic Ghost 6
  sample data (including `status` and `newsletters`) for member operations.

Fixes:

* (Fix) Tag Created trigger read the wrong webhook payload key and returned
  no tag data when fired.
* (Fix) Member and Author searches detect "not found" by response status
  instead of error-message text, so empty search results are returned
  reliably on current Ghost versions.

## 2.6.3

* Add `uuid` to Member Updated trigger

## 2.6.2

* Add `status` property to Member Updated trigger
* Fix Member Search action to return correct results when no member is found

## 2.6.0

* (New) Allow multiple newsletters to be added to members

## 2.5.2

* (Fix) Correct help text for the "subscribed" boolean for members

## 2.5.1

* (New) User-Agent headers sent to connected Ghost instance
## 2.5.0

* (New) Accept-Version headers sent to connected Ghost instance

## 2.4.2

* (Fix) Hide deprecated "subscriber" triggers & actions

## 2.4.1

* (Fix) Fixed handling of `send_email` flag on member creation

## 2.4.0

* (New) Added "Post scheduled" trigger
* (New) Added "Member" search
* (New) Added "Update member" create action
* (New) Updated "Create Member" action to allow "subscribed", "comped", and "note" fields
* (New) Updated "important" triggers by adding "member_create" and "page_published"
* (New) Updated "Member Updated" trigger fields with "labels", "subscribed", and "comped" fields

## 2.3.1

* (Fix) Fixed authentication test showing success when API key is incorrect

## 2.3.0

* (New) Updated "Create Member" action to allow labels (needs >= Ghost 3.6)

## 2.2.1

* (Fix) Fixed "Validation failed for 'members[0]'" error when creating member

## 2.2.0

* (New) Added "Member updated" trigger
* (New) Added "Member deleted" trigger

## 2.1.4

* (Fix) Fixed "ResourceNotFound" error when using the "Create member" action

## 2.1.3

* (Fix) Fixed "GhostAdminAPI Config Invalid" error showing when setting up a "Member created" trigger

## 2.1.2

* (Fix) Fixed "Resource not found" error showing when setting up a "Member created" trigger

## 2.1.1

* (Fix) Fixed invalid version error when connecting a Ghost 3.0 site

## 2.1.0

* (New) Added a "Create Member" action
* (New) Added a "Member Created" trigger
* (Deprecated) Subscribers-related functionality is deprecated, it will cease to function when used with Ghost 3.0 or later

## 2.0.1

* (Fix) Fixed `html` and `plaintext` not being present when fetching sample data for "post/page published" triggers

## 2.0.0

* (Breaking) Switched to Ghost's v2 Admin API and API Key Authentication (minimum compatible Ghost version is 2.19.0)
* (New) Added a "Create Post" action
* (New) "New Story" trigger has been split into "Post Published"/"Page Published" and is now instant
* (New) Added an "Author Created" trigger
* (New) Added a "Tag Created" trigger
* (New) Added a "Find an Author" search

## 1.0.5

* (Fix) Added Ghost 2.x to supported Ghost versions

## 1.0.4

* (Fix) Fixed authentication failing when refresh token expires

## 1.0.3

* Initial public release
