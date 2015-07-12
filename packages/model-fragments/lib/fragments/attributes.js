import Ember from 'ember';
import computedPolyfill from '../util/ember-new-computed';
import StatefulArray from './array/stateful';
import FragmentArray from './array/fragment';
import { getActualFragmentType } from './model';

/**
  @module ember-data.model-fragments
*/

var get = Ember.get;

function setFragmentOwner(fragment, record, key) {
  Ember.assert("Fragments can only belong to one owner, try copying instead", !get(fragment, '_owner') || get(fragment, '_owner') === record);
  return fragment.setProperties({
    _owner : record,
    _name  : key
  });
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
function hasOneFragment(declaredTypeName, options) {
  options = options || {};

  var meta = {
    type: 'fragment',
    isAttribute: true,
    isFragment: true,
    options: options
  };

  function setupFragment(record, key, value) {
    var store = record.store;
    var data = record._data[key] || getDefaultValue(record, options, 'object');
    var fragment = record._fragments[key];
    var actualTypeName = getActualFragmentType(declaredTypeName, options, data);

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
      fragment || (fragment = setFragmentOwner(store.buildFragment(actualTypeName), record, key));
      //Make sure to first cache the fragment before calling setupData, so if setupData causes this CP to be accessed
      //again we have it cached already
      record._data[key] = fragment;
      fragment.setupData(data);
    } else {
      // Handle the adapter setting the fragment to null
      fragment = data;
    }

    return fragment;
  }

  return computedPolyfill({
    set: function(key, value) {
      var fragment = setupFragment(this, key, value);
      var store = this.store;

      Ember.assert("You can only assign a '" + declaredTypeName + "' fragment to this property", value === null || isInstanceOfType(store.modelFor(declaredTypeName), value));
      fragment = value ? setFragmentOwner(value, this, key) : null;

      if (this._data[key] !== fragment) {
        this.fragmentDidDirty(key, fragment);
      } else {
        this.fragmentDidReset(key, fragment);
      }

      return this._fragments[key] = fragment;
    },
    get: function(key) {
      var fragment = setupFragment(this, key);
      return this._fragments[key] = fragment;
    }
  }).meta(meta);
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
function hasManyFragments(declaredTypeName, options) {
  // If a declaredTypeName is not given, it implies an array of primitives
  if (Ember.typeOf(declaredTypeName) !== 'string') {
    options = declaredTypeName;
    declaredTypeName = null;
  }

  options = options || {};

  var meta = {
    type: 'fragment',
    isAttribute: true,
    isFragment: true,
    options: options,
    kind: 'hasMany'
  };

  function createArray(record, key) {
    var arrayClass = declaredTypeName ? FragmentArray : StatefulArray;

    return arrayClass.create({
      type    : declaredTypeName,
      options : options,
      name    : key,
      owner   : record
    });
  }

  function setupArrayFragment(record, key, value) {
    var data = record._data[key] || getDefaultValue(record, options, 'array');
    var fragments = record._fragments[key] || null;

    //If we already have a processed fragment in _data and our current fragmet is
    //null simply reuse the one from data. We can be in this state after a rollback
    //for example
    if (data instanceof StatefulArray && !fragments) {
      fragments = data;
    // Create a fragment array and initialize with data
    } else if (data && data !== fragments) {
      fragments || (fragments = createArray(record, key));
      record._data[key] = fragments;
      fragments.setupData(data);
    } else {
      // Handle the adapter setting the fragment array to null
      fragments = data;
    }

    return fragments;
  }

  return computedPolyfill({
    set: function(key, value) {
      var fragments = setupArrayFragment(this, key, value);

      if (Ember.isArray(value)) {
        fragments || (fragments = createArray(this, key));
        fragments.setObjects(value);
      } else if (value === null) {
        fragments = null;
      } else {
        Ember.assert("A fragment array property can only be assigned an array or null");
      }

      if (this._data[key] !== fragments || get(fragments, 'isDirty')) {
        this.fragmentDidDirty(key, fragments);
      } else {
        this.fragmentDidReset(key, fragments);
      }

      return this._fragments[key] = fragments;
    },
    get: function(key) {
      var fragments = setupArrayFragment(this, key);
      return this._fragments[key] = fragments;
    }
  }).meta(meta);
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
  return Ember.computed.alias('_owner').readOnly();
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
