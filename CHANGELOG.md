# Changelog

### v0.2.1 (October 2, 2014)

* Fixed infinite recursion issue with nested hasManyFragments
* Fragment array reloads now notify array observers,
* Fix bower runtime dependencies to include Ember Data

### v0.2.0 (May 22, 2014)

* Reformatted/added comments to conform to YUIDoc
* Fixed issue with saving a record with null fragments
* Fixed issue with rollback when fragment is set to null
* Fixed issue with fragment array methods bypassing `replaceContent`
* Added support for empty adapter response
* Fixed issue with owner-less fragments on new records
* Added limited support for fragments in `DS.Model#changedAttributes`
* Fixed issue with setting a `hasOneFragment` property to null
* Fixed issue with `hasOneFragment` default values

### v0.1.0 (May 20, 2014)

* Initial release compatible with original gist
