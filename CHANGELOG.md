# Changelog

### v0.4.1 (August 19, 2015)

* Added warning about changing default value for array fragment properties
* Added support for copying nested fragments (louy)
* Fixed broken fragment copying (jakesjews)

### v0.4.0 (August 14, 2015)

* Updated to support Ember Data v1.13

### v0.3.3 (May 20, 2015)

* Removed deprecations in test suite
* Removed computed property deprecations (jakesjews)
* Added fragment transform module for unit testing ember-cli apps (rwjblue)

### v0.3.2 (April 20, 2015)

* Removed duplicate addon definition

### v0.3.1 (March 30, 2015)

* Fixed "properly formatted package" ember-cli warning
* Fixed bad file name in 'fragment' blueprint using pod structure

### v0.3.0 (February 27, 2015)

* Added support for Snapshots to support Ember Data v1.0.0-beta.15
* Added explicit ordering to ember-cli addon

### v0.2.8 (February 2, 2015)

* Fixed infinite loops when reloading observed fragments (igort)

### v0.2.7 (January 16, 2015)

* Fixed issue with multiple rollbacks failing
* Fixed issue with changed properties not being notified on reload

### v0.2.6 (January 8, 2015)

* Fixed infinite recursion issue after save when observing fragment array props
* Fixed issue with `ember install:addon` not invoking correct blueprint
* Fixed issue with Ember CLI including addon dir in JS tree

### v0.2.5 (January 6, 2015)

* Support type checks with `Ember.MODEL_FACTORY_INJECTIONS` set to true
* Fixed issue with broken ember-cli install:addon

### v0.2.4 (January 5, 2015)

* Updated to support Ember Data v1.0.0-beta.14 (igort)

### v0.2.3 (January 5, 2015)

* Added Ember CLI addon
* Updated Ember Data version dependency in Bower package

### v0.2.2 (November 3, 2014)

* Added support for polymorphic fragments (marcus-nl)

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
