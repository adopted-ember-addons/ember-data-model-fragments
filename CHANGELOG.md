# Changelog

### v5.0.0-beta.3 (December 22, 2021)





## v5.0.0-beta.8 (2022-06-07)

#### :bug: Bug Fix
* [#439](https://github.com/adopted-ember-addons/ember-data-model-fragments/pull/439) fix(array): allow resetting an array to null ([@VincentMolinie](https://github.com/VincentMolinie))
* [#438](https://github.com/adopted-ember-addons/ember-data-model-fragments/pull/438) fix(polymorphic): update of type of a polymorphic key works ([@VincentMolinie](https://github.com/VincentMolinie))

#### :house: Internal
* [#423](https://github.com/adopted-ember-addons/ember-data-model-fragments/pull/423) Remove assign usage ([@charlesfries](https://github.com/charlesfries))

#### Committers: 2
- Charles Fries ([@charlesfries](https://github.com/charlesfries))
- Vincent Molinié ([@VincentMolinie](https://github.com/VincentMolinie))

## v5.0.0-beta.7 (2022-04-21)

## v5.0.0-beta.6 (2022-04-14)

#### :bug: Bug Fix
* [#432](https://github.com/adopted-ember-addons/ember-data-model-fragments/pull/432) fix(serializer): fix the deserialization when using a typeKey as a function ([@VincentMolinie](https://github.com/VincentMolinie))

#### :house: Internal
* [#434](https://github.com/adopted-ember-addons/ember-data-model-fragments/pull/434) Remove bowerDependencies warning ([@charlesfries](https://github.com/charlesfries))

#### Committers: 2
- Charles Fries ([@charlesfries](https://github.com/charlesfries))
- Vincent Molinié ([@VincentMolinie](https://github.com/VincentMolinie))

## v5.0.0-beta.5 (2022-03-17)

#### :bug: Bug Fix
* [#431](https://github.com/adopted-ember-addons/ember-data-model-fragments/pull/431) fix(dirty state): prevent record from being tagged as dirty when not changed ([@VincentMolinie](https://github.com/VincentMolinie))

#### Committers: 1
- Vincent Molinié ([@VincentMolinie](https://github.com/VincentMolinie))

## v5.0.0-beta.4 (2022-03-16)

#### :rocket: Enhancement
* [#430](https://github.com/adopted-ember-addons/ember-data-model-fragments/pull/430) feat(polymorphism): add the possibility to compute the type based on owner and data ([@VincentMolinie](https://github.com/VincentMolinie))

#### :bug: Bug Fix
* [#428](https://github.com/adopted-ember-addons/ember-data-model-fragments/pull/428) fix: handle current state not yet set ([@VincentMolinie](https://github.com/VincentMolinie))

#### :house: Internal
* [#425](https://github.com/adopted-ember-addons/ember-data-model-fragments/pull/425) Bump mout from 1.2.2 to 1.2.3 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#395](https://github.com/adopted-ember-addons/ember-data-model-fragments/pull/395) Bump elliptic from 6.5.3 to 6.5.4 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#424](https://github.com/adopted-ember-addons/ember-data-model-fragments/pull/424) Add `release-it` to automate releases and add missing entries from CHANGELOG.md ([@patocallaghan](https://github.com/patocallaghan))
* [#421](https://github.com/adopted-ember-addons/ember-data-model-fragments/pull/421) Bump follow-redirects from 1.13.0 to 1.14.7 ([@dependabot[bot]](https://github.com/apps/dependabot))

#### Committers: 2
- Pat O'Callaghan ([@patocallaghan](https://github.com/patocallaghan))
- Vincent Molinié ([@VincentMolinie](https://github.com/VincentMolinie))

## What's Changed
* 🐛 Bugfix: Pass arguments to `super.commitWasRejected` to get back `DS.Errors` by @enspandi in https://github.com/adopted-ember-addons/ember-data-model-fragments/pull/412
* 🐛 Bugfix: modelName undefined when serializing fragment and fragment array by @knownasilya in https://github.com/adopted-ember-addons/ember-data-model-fragments/pull/407
* 🐛 Bugfix: Fix serialization in ember 3.28 by @VincentMolinie in https://github.com/adopted-ember-addons/ember-data-model-fragments/pull/414
* 🐛 Bugfix: Fix fragment attributes in save response being ignored by @dwickern in https://github.com/adopted-ember-addons/ember-data-model-fragments/pull/404
* 🏠 Do not fail CI on Ember release by @patocallaghan in https://github.com/adopted-ember-addons/ember-data-model-fragments/pull/419
* 💥 Breaking fix: respect null on server updates  by @ro0gr in https://github.com/adopted-ember-addons/ember-data-model-fragments/pull/415
* 🐛 Bugfix: Make sure we can update fragments/fragment arrays after they are initially set to null by @patocallaghan in https://github.com/adopted-ember-addons/ember-data-model-fragments/pull/384

## Breaking change
Before v5.0.0-beta.3, when setting a fragment array property to `null` from a server response, it wouldn't nullify the attribute. Instead, the fragment array instance just became empty with no items inside. Now updating the fragment array to `null` works correctly and is consistent with fragments behaviour. For more details see https://github.com/adopted-ember-addons/ember-data-model-fragments/pull/415.

### v5.0.0-beta.2 (April 20, 2021)
* 🐛 Bugfix: [#397](https://github.com/adopted-ember-addons/ember-data-model-fragments/pull/397) Use send('loadedData') instead of loadedData method (@runspired)

### v5.0.0-beta.1 (November 12, 2020)

* [#381](https://github.com/adopted-ember-addons/ember-data-model-fragments/pull/381) Fix `hasDirtyAttributes` when resetting a property (@VincentMolinie)
* [#385](https://github.com/adopted-ember-addons/ember-data-model-fragments/pull/385) Upgrade to Ember 3.20 LTS (@patocallaghan)

### v5.0.0-beta.0 (May 28, 2020)

* [#360](https://github.com/adopted-ember-addons/ember-data-model-fragments/pull/360) Upgrade to work with Ember Data 3.16 (@richgt, @igorT)

### v4.0.0 (January 25, 2019)

* Ember 3.5.0 compatibility with breaking changes related to `RecordData`. (@cohitre)
* Fixed `changedAtributes` with fragments (@Gorzas)

### v3.3.0 (August 2nd, 2018)

* Update Ember to 3.3.0 (@jakesjews)
* Fixed ember-data compatibility the `fields` property on ember-data model class (@rondale-sc)
* Fixed bug with setting array fragment attr to null (@Techn1x)
* Use `ember-copy` instead of `Ember.copy`/`Ember.Copyable` (@pauln)
* Removed deprecated exports (@jakesjews)
* Replace `exists-sync` package with `fs.existsSync` (@jakesjews)
* Fix ember-data compatibility with `type.modelName` and `_internalModel.modelName` (@JosephHalter)
* Prevent infinite recursion on save with fragmentArray (@JosephHalter)
* When `defaultValue` is a function, don't copy (@Techn1x)

### v3.0.0 (April 4th, 2018)

* Upgrade to Ember 3.0 (@jakesjews)

### v3.0.0-beta.1 (February 7th, 2018)

* Added support for Ember-Data 3.0 (@rondale-sc, @jakesjews)
* Upgraded to Ember 2.15, 2.16, 2.17 (@jakesjews)
* Switched from NPM to Yarn (@jakesjews)
* Added `cacheKeyForTree` to the build pipeline (@thec0keman)

### v2.14.0 (June 27th, 2017)

* Added support for Ember-Data 2.14 (@workmanw)

### v2.11.5 (June 19th, 2017)

* Fixed bug with fragments invoking ready callback (@danielspaniel)

### v2.11.4 (June 10th, 2017)

* Reverting prior bugfix. Unfortunately the fix resulted in infinite loop in for some users. (@jakesjews)

### v2.11.3 (May 5th, 2017)

* Upgrade to Ember 2.13 (@workmanw)
* Fixed Ember-Data 2.13.0 issue related to internalModel caching change. (@workmanw)
* Upgrade to Ember 2.12 (@jakesjews)

### v2.11.2 (March 1st, 2017)

* Fixed Ember-Data 2.11.2 issue caused by `modelFactoryFor` change (@workmanw)

### v2.11.1 (February 19th, 2017)

* Fixed max call stack error aka Alias Loop (@kobsy, Rob Riebau `<github handle unknown>`)
* Replaced JSHint with ESLint (@workmanw)
* Renamed the ES6 module from `model-fragments` to `ember-data-model-fragments` (@workmanw)
* ES6-ified the addon. Utilized ES6 conveniences more throughout the codebase (@workmanw)
* Fixed an Ember-Data 2.12 compatibility issue (@workmanw)
* Removed deprecation from upcoming Ember 2.12 release (@workmanw)
* Updated to ember-cli 2.11.0 (@jakesjews)

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
