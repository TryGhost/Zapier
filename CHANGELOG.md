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
