import Ember from 'ember';
import computedPolyfill from '../util/ember-new-computed';
import StatefulArray from './array/stateful';
import FragmentArray from './array/fragment';
import { fragmentDidDirty, fragmentDidReset } from './states';
import { setFragmentOwner, getActualFragmentType } from './model';
import { internalModelFor } from './model';

/**
  @module ember-data.model-fragments
*/

var get = Ember.get;

// Create a unique type string for the combination of fragment property type,
// fragment model name, and polymorphic type key
function metaTypeFor(type, modelName, options) {
  var metaType = '-mf-' + type;

  if (modelName) {
    metaType += '$' + modelName;
  }

  if (options && options.polymorphic) {
    metaType += '$' + (options.typeKey || 'type');
  }

  return metaType;
}

/**
  `DS.hasOneFragment` defines an attribute on a `DS.Model` or `DS.ModelFragment`
  instance. Much like `DS.belongsTo`, it creates a property that returns a
  single fragment of the given type.

  `DS.hasOneFragment` takes an optional hash as a second parameter, currently
  supported options are:

  - `defaultValue`: An object literal or a function to be called to set the
    attribute to a default value if none is supplied. Values are deep copied
    before being used. Note that default values will be passed through the
    fragment's serializer when creating the fragment.

  Example

  ```javascript
  App.Person = DS.Model.extend({
    name: DS.hasOneFragment('name', { defaultValue: {} })
  });

  App.Name = DS.ModelFragment.extend({
    first  : DS.attr('string'),
    last   : DS.attr('string')
  });
  ```

  @namespace
  @method hasOneFragment
  @for DS
  @param {String} type the fragment type
  @param {Object} options a hash of options
  @return {Attribute}
*/
function hasOneFragment(declaredModelName, options) {
  options = options || {};

  var metaType = metaTypeFor('fragment', declaredModelName, options);

  function setupFragment(store, record, key) {
    var internalModel = internalModelFor(record);
    var data = internalModel._data[key] || getDefaultValue(internalModel, options, 'object');
    var fragment = internalModel._fragments[key];
    var actualTypeName = getActualFragmentType(declaredModelName, options, data);

    // Regardless of whether being called as a setter or getter, the fragment
    // may not be initialized yet, in which case the data will contain a
    // raw response or a stashed away fragment

    // If we already have a processed fragment in _data and our current fragmet is
    // null simply reuse the one from data. We can be in this state after a rollback
    // for example
    if (!fragment && isInstanceOfType(store.modelFor(actualTypeName), data)) {
      fragment = data;
    // Else initialize the fragment
    } else if (data && data !== fragment) {
      fragment || (fragment = setFragmentOwner(store.createFragment(actualTypeName), record, key));
      // Make sure to first cache the fragment before calling setupData, so if setupData causes this CP to be accessed
      // again we have it cached already
      internalModel._data[key] = fragment;
      internalModelFor(fragment).setupData({
        attributes: data
      });
    } else {
      // Handle the adapter setting the fragment to null
      fragment = data;
    }

    return fragment;
  }

  function setFragmentValue(record, key, fragment, value) {
    Ember.assert("You can only assign a '" + declaredModelName + "' fragment to this property", value === null || isInstanceOfType(record.store.modelFor(declaredModelName), value));

    var internalModel = internalModelFor(record);
    fragment = value ? setFragmentOwner(value, record, key) : null;

    if (internalModel._data[key] !== fragment) {
      fragmentDidDirty(record, key, fragment);
    } else {
      fragmentDidReset(record, key);
    }

    return fragment;
  }

  return fragmentProperty(metaType, options, setupFragment, setFragmentValue);
}

// Check whether a fragment is an instance of the given type, respecting model
// factory injections
function isInstanceOfType(type, fragment) {
  if (fragment instanceof type) {
    return true;
  } else if (Ember.MODEL_FACTORY_INJECTIONS) {
    return fragment instanceof type.superclass;
  }

  return false;
}

/**
  `DS.hasManyFragments` defines an attribute on a `DS.Model` or
  `DS.ModelFragment` instance. Much like `DS.hasMany`, it creates a property
  that returns an array of fragments of the given type. The array is aware of
  its original state and so has a `hasDirtyAttributes` property and a `rollback` method.
  If a fragment type is not given, values are not converted to fragments, but
  passed straight through.

  `DS.hasOneFragment` takes an optional hash as a second parameter, currently
  supported options are:

  - `defaultValue`: An array literal or a function to be called to set the
    attribute to a default value if none is supplied. Values are deep copied
    before being used. Note that default values will be passed through the
    fragment's serializer when creating the fragment.

  Example

  ```javascript
  App.Person = DS.Model.extend({
    addresses: DS.hasManyFragments('address', { defaultValue: [] })
  });

  App.Address = DS.ModelFragment.extend({
    street  : DS.attr('string'),
    city    : DS.attr('string'),
    region  : DS.attr('string'),
    country : DS.attr('string')
  });
  ```

  @namespace
  @method hasManyFragments
  @for DS
  @param {String} type the fragment type (optional)
  @param {Object} options a hash of options
  @return {Attribute}
*/
function hasManyFragments(modelName, options) {
  options || (options = {});

  // If a modelName is not given, it implies an array of primitives
  if (Ember.typeOf(modelName) !== 'string') {
    return arrayProperty(options);
  }

  var metaType = metaTypeFor('fragment-array', modelName, options);

  return fragmentArrayProperty(metaType, options, function createFragmentArray(record, key) {
    return FragmentArray.create({
      type: modelName,
      options: options,
      name: key,
      owner: record
    });
  });
}

function arrayProperty(options) {
  options || (options = {});

  var metaType = metaTypeFor('array');

  return fragmentArrayProperty(metaType, options, function createStatefulArray(record, key) {
    return StatefulArray.create({
      options: options,
      name: key,
      owner: record
    });
  });
}

function fragmentProperty(type, options, setupFragment, setFragmentValue) {
  options = options || {};

  var meta = {
    type: type,
    isAttribute: true,
    isFragment: true,
    options: options
  };

  return computedPolyfill({
    get: function(key) {
      var internalModel = internalModelFor(this);
      var fragment = setupFragment(this.store, this, key);

      return internalModel._fragments[key] = fragment;
    },
    set: function(key, value) {
      var internalModel = internalModelFor(this);
      var fragment = setupFragment(this.store, this, key);

      fragment = setFragmentValue(this, key, fragment, value);

      return internalModel._fragments[key] = fragment;
    }
  }).meta(meta);
}

function fragmentArrayProperty(metaType, options, createArray) {
  function setupFragmentArray(store, record, key) {
    var internalModel = internalModelFor(record);
    var data = internalModel._data[key] || getDefaultValue(internalModel, options, 'array');
    var fragments = internalModel._fragments[key] || null;

    // If we already have a processed fragment in _data and our current fragmet is
    // null simply reuse the one from data. We can be in this state after a rollback
    // for example
    if (data instanceof StatefulArray && !fragments) {
      fragments = data;
    // Create a fragment array and initialize with data
    } else if (data && data !== fragments) {
      fragments || (fragments = createArray(record, key));
      internalModel._data[key] = fragments;
      fragments.setupData(data);
    } else {
      // Handle the adapter setting the fragment array to null
      fragments = data;
    }

    return fragments;
  }

  function setFragmentValue(record, key, fragments, value) {
    var internalModel = internalModelFor(record);

    if (Ember.isArray(value)) {
      fragments || (fragments = createArray(record, key));
      fragments.setObjects(value);
    } else if (value === null) {
      fragments = null;
    } else {
      Ember.assert("A fragment array property can only be assigned an array or null");
    }

    if (internalModel._data[key] !== fragments || get(fragments, 'hasDirtyAttributes')) {
      fragmentDidDirty(record, key, fragments);
    } else {
      fragmentDidReset(record, key);
    }

    return fragments;
  }

  return fragmentProperty(metaType, options, setupFragmentArray, setFragmentValue);
}

// Like `DS.belongsTo`, when used within a model fragment is a reference
// to the owner record
/**
  `DS.fragmentOwner` defines a read-only attribute on a `DS.ModelFragment`
  instance. The attribute returns a reference to the fragment's owner
  record.

  Example

  ```javascript
  App.Person = DS.Model.extend({
    name: DS.hasOneFragment('name')
  });

  App.Name = DS.ModelFragment.extend({
    first  : DS.attr('string'),
    last   : DS.attr('string'),
    person : DS.fragmentOwner()
  });
  ```

  @namespace
  @method fragmentOwner
  @for DS
  @return {Attribute}
*/
function fragmentOwner() {
  // TODO: add a warning when this is used on a non-fragment
  return Ember.computed(function() {
    return internalModelFor(this)._owner;
  }).readOnly();
}

// The default value of a fragment is either an array or an object,
// which should automatically get deep copied
function getDefaultValue(record, options, type) {
  var value;

  if (typeof options.defaultValue === "function") {
    value = options.defaultValue();
  } else if (options.defaultValue) {
    value = options.defaultValue;
  } else {
    return null;
  }

  Ember.assert("The fragment's default value must be an " + type, Ember.typeOf(value) == type);

  // Create a deep copy of the resulting value to avoid shared reference errors
  return Ember.copy(value, true);
}

export { hasOneFragment, hasManyFragments, fragmentOwner };
