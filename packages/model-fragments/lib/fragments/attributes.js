import Ember from 'ember';
import StatefulArray from './array/stateful';
import FragmentArray from './array/fragment';
import { getActualFragmentType } from './model';

/**
  @module ember-data.model-fragments
*/

var get = Ember.get;

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
function hasOneFragment(declaredType, options) {
  options = options || {};

  var meta = {
    type: 'fragment',
    isAttribute: true,
    isFragment: true,
    options: options
  };

  return Ember.computed(function(key, value) {
    var record = this;
    var data = this._data[key] || getDefaultValue(this, options, 'object');
    var fragment = this._fragments[key];
    var actualType = getActualFragmentType(declaredType, options, data);

    function setOwner(fragment) {
      Ember.assert("Fragments can only belong to one owner, try copying instead", !get(fragment, '_owner') || get(fragment, '_owner') === record);
      return fragment.setProperties({
        _owner : record,
        _name  : key
      });
    }

    // Regardless of whether being called as a setter or getter, the fragment
    // may not be initialized yet, in which case the data will contain a
    // partial raw response
    if (data && data !== fragment) {
      fragment || (fragment = setOwner(this.store.buildFragment(actualType)));
      fragment.setupData(data);
      this._data[key] = fragment;
    } else {
      // Handle the adapter setting the fragment to null
      fragment = data;
    }

    // Handle being called as a setter
    if (arguments.length > 1) {
      Ember.assert("You can only assign a '" + declaredType + "' fragment to this property", value === null || value instanceof this.store.modelFor(declaredType));

      fragment = value ? setOwner(value) : null;

      if (this._data[key] !== fragment) {
        this.fragmentDidDirty(key, fragment);
      } else {
        this.fragmentDidReset(key, fragment);
      }
    }

    return this._fragments[key] = fragment;
  }).property('isDirty').meta(meta);
}

/**
  `DS.hasManyFragments` defines an attribute on a `DS.Model` or
  `DS.ModelFragment` instance. Much like `DS.hasMany`, it creates a property
  that returns an array of fragments of the given type. The array is aware of
  its original state and so has a `isDirty` property and a `rollback` method.
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
    addresses: DS.hasManyFragments('name', { defaultValue: [] })
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
function hasManyFragments(declaredType, options) {
  // If a declaredType is not given, it implies an array of primitives
  if (Ember.typeOf(declaredType) !== 'string') {
    options = declaredType;
    declaredType = null;
  }

  options = options || {};

  var meta = {
    type: 'fragment',
    isAttribute: true,
    isFragment: true,
    options: options,
    kind: 'hasMany'
  };

  return Ember.computed(function(key, value) {
    var record = this;
    var data = this._data[key] || getDefaultValue(this, options, 'array');
    var fragments = this._fragments[key] || null;

    function createArray() {
      var arrayClass = declaredType ? FragmentArray : StatefulArray;

      return arrayClass.create({
        type    : declaredType,
        options : options,
        name    : key,
        owner   : record
      });
    }

    // Create a fragment array and initialize with data
    if (data && data !== fragments) {
      fragments || (fragments = createArray());
      fragments.setupData(data);
      this._data[key] = fragments;
    } else {
      // Handle the adapter setting the fragment array to null
      fragments = data;
    }

    if (arguments.length > 1) {
      if (Ember.isArray(value)) {
        fragments || (fragments = createArray());
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
    }

    return this._fragments[key] = fragments;
  }).property('isDirty').meta(meta);
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
