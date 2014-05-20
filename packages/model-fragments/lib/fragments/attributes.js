import Ember from 'ember';
import PrimitiveArray from './array/primitive';
import FragmentArray from './array/fragment';

var get = Ember.get;

// Like `DS.belongsTo`, declares that the property contains a single
// model fragment of the given type
function hasOneFragment (type, options) {
  options = options || {};

  var meta = {
    type: 'fragment',
    isAttribute: true,
    isFragment: true,
    options: options
  };

  return Ember.computed(function(key, value) {
    var data = this._data[key] || getDefaultValue(this, options, 'array');
    var fragment = this._fragments[key];

    if (data && data !== fragment) {
      if (!fragment) {
        fragment = this.store.buildFragment(type);

        // Set the correct owner/name on the fragment
        fragment.setProperties({
          _owner : this,
          _name  : key
        });
      }

      fragment.setupData(data);
      this._data[key] = fragment;
    }

    if (arguments.length > 1) {
      Ember.assert("You can only assign a '" + type + "' fragment to this property", value instanceof this.store.modelFor(type));

      fragment = value;

      if (this._data[key] !== fragment) {
        this.fragmentDidDirty(key, fragment);
      } else {
        this.fragmentDidReset(key, fragment);
      }
    }

    return this._fragments[key] = fragment;
  }).property('data').meta(meta);
}

// Like `DS.hasMany`, declares that the property contains an array of
// either primitives, or model fragments of the given type
function hasManyFragments(type, options) {
  // If a type is not given, it implies an array of primitives
  if (Ember.typeOf(type) !== 'string') {
    options = type;
    type = null;
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
      var arrayClass = type ? FragmentArray : PrimitiveArray;

      return arrayClass.create({
        type  : type,
        name  : key,
        owner : record
      });
    }

    // Create a fragment array and initialize with data
    if (data && data !== fragments) {
      fragments || (fragments = createArray());
      fragments.setupData(data);
      this._data[key] = fragments;
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
  }).property('data').meta(meta);
}

// Like `DS.belongsTo`, when used within a model fragment is a reference
// to the owner record
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

  return Ember.copy(value, true);
}

export { hasOneFragment, hasManyFragments, fragmentOwner };
