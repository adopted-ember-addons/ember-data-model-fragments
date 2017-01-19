# Changelog

### v2.11.0 (January 19th, 2017)

* Fixed infinite loop issue caused by deprecation of `store.lookupSerializer` (@runspired, @workmanw)
* Added `store.isFragment` for easier detection (@gavinjoyce)
* Removed usage of deprecated Ember.K (@cibernox)

### v2.3.3 (December 12, 2016)

* Updated to ember-cli 2.10.0 (@jakesjews)
* Use the `ember-data` initializer as a target instead of the soon to be deprecated `store` initializer (@bmac)
* Fixed issue that caused `internalModel is null` exception (@cesarizu)

### v2.3.2 (June 18, 2016)

* Fixed ember-cli deprecation warning (@jakesjews)

### v2.3.1 (April 20, 2016)

* Fixed issue with deprecated use of `Ember.get` (@jakesjews)

### v2.3.0 (March 31, 2016)

* Fully converted to ember-cli addon (@jakesjews, @workmanw)

### v2.1.2 (March 21, 2016)

* Fixed memory leak caused by fragments not being destroyed (@dwickern)
* Fixed issue with rolling back fragments after adapter error (@workmanw)
* Fixed `isNew` not reporting correct state

### v1.13.3 (March 21, 2016)

* Backported fix for memory leak caused by fragments not being destroyed (@dwickern)
* Backported fix for issue with rolling back fragments after adapter error (@workmanw)
* Backported fix for `isNew` not reporting correct state

### v2.1.1 (December 23, 2015)

* Fixed issue with `store.push` leaving records dirty

### v2.0.2 (December 23, 2015)

* Backported fix for issue with `store.push` leaving records dirty

### v1.13.2 (December 23, 2015)

* Backported fix for issue with `store.push` leaving records dirty

### v2.1.0 (November 15, 2015)

* Updated Ember/ED > v2.1.x
* Fixed initializer argument deprecation

### v2.0.1 (November 15, 2015)

* Fixed issue with looking up application/default serializers with `store#serializerFor` (@thec0keman)

### v1.13.1 (November 15, 2015)

* Backported fix for application/default serializer lookup

### v2.0.0 (October 28, 2015)

* Removed Deprecated APIs
* Fixed breaking changes in Ember 2.0
* Fixed deserialization issue when `isNewSerializerAPI` is not specified

##### Breaking Changes

The `isDirty` and `rollback` methods on fragments and fragment arrays have been removed (use `hasDirtyAttributes` and `rollbackAttributes` instead).

### v1.13.0 (October 25, 2015)

* Removed deprecated APIs
* Changed default value of fragment array properties to an empty array
* Changed repository name

##### Breaking Changes

Deprecated APIs have been removed:

* `DS.ModelFragment` → `MF.Fragment`
* `DS.hasOneFragment` → `MF.fragment`
* `DS.hasManyFragments` → `MF.fragmentArray`
* `DS.fragmentOwner` → `MF.fragmentOwner`

Support for non-fragment array properties has been added with the new property `MF.array`, which supports transforms:

```javascript
export default DS.Model.extend({
  things: MF.array('string'),
  stuff: MF.array('my-custom-transform')
});
```

The default value of fragment array properties is now an empty array (previously `null`):

```javascript
export default DS.Model.extend({
  things: MF.fragmentArray('some-fragment'), // { defaultValue: [] } option is no longer necessary
  stuff: MF.array('string') // Defaults to an empty array as well
});
```

The repository name has changed from `ember-data.model-fragments` to `ember-data-model-fragments`. This does not affect the NPM package name, but does affect the Bower package. Consequently, when upgrading from v0.4.x to v1.13.x, in addition to making sure the addon blueprint runs, the old Bower package must be removed manually:

```sh
$ bower uninstall --save ember-data.model-fragments
```

### v0.4.4 (October 25, 2015)

* Reverted clearing fragment owner to maintain rollback support
* Fixed issue with record dirtiness when setting with object literal

### v0.4.3 (October 14, 2015)

* Updated API and added deprecation warnings to all outdated APIs
* Fixed issue with initializer arguments in Ember 2.1 (@jakesjews)

### v0.4.2 (October 11, 2015)

* Added support for setting fragment properties with object literals
* Fixed issue with fragment properties not being notified on create
* Fixed falsy default values being clobbered (@christophersansone)
* Fixed bad registry property reference in Ember v2.1 (@abuiles)
* Updated fragment properties to clear owner when releasing fragments

### v0.4.1 (August 19, 2015)

* Added warning about changing default value for array fragment properties
* Added support for copying nested fragments (@louy)
* Fixed broken fragment copying (@jakesjews)

### v0.4.0 (August 14, 2015)

* Updated to support Ember Data v1.13

### v0.3.3 (May 20, 2015)

* Removed deprecations in test suite
* Removed computed property deprecations (@jakesjews)
* Added fragment transform module for unit testing ember-cli apps (@rwjblue)

### v0.3.2 (April 20, 2015)

* Removed duplicate addon definition

### v0.3.1 (March 30, 2015)

* Fixed "properly formatted package" ember-cli warning
* Fixed bad file name in 'fragment' blueprint using pod structure

### v0.3.0 (February 27, 2015)

* Added support for Snapshots to support Ember Data v1.0.0-beta.15
* Added explicit ordering to ember-cli addon

### v0.2.8 (February 2, 2015)

* Fixed infinite loops when reloading observed fragments (@igort)

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

* Updated to support Ember Data v1.0.0-beta.14 (@igort)

### v0.2.3 (January 5, 2015)

* Added Ember CLI addon
* Updated Ember Data version dependency in Bower package

### v0.2.2 (November 3, 2014)

* Added support for polymorphic fragments (@marcus-nl)

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
