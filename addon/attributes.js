import { assert } from '@ember/debug';
import { computed } from '@ember/object';
import {
  internalModelFor,
  isFragment
} from './fragment';

/**
  @module ember-data-model-fragments
*/

// Create a unique type string for the combination of fragment property type,
// transform type (or fragment model), and polymorphic type key
function metaTypeFor(name, type, options) {
  let metaType = `-mf-${name}`;

  if (type) {
    metaType += `$${type}`;
  }

  if (options && options.polymorphic) {
    let typeKey = options.typeKey || 'type';
    metaType += `$${typeKey}`;
  }

  return metaType;
}

/**
  `MF.fragment` defines an attribute on a `DS.Model` or `MF.Fragment`. Much
  like `DS.belongsTo`, it creates a property that returns a single fragment of
  the given type.

  It takes an optional hash as a second parameter, currently supported options
  are:

  - `defaultValue`: An object literal or a function to be called to set the
    attribute to a default value if none is supplied. Values are deep copied
    before being used. Note that default values will be passed through the
    fragment's serializer when creating the fragment. Defaults to `null`.
  - `polymorphic`: Whether or not the fragments in the array can be child
    classes of the given type.
  - `typeKey`: If `polymorphic` is true, the property to use as the fragment
    type in the normalized data. Defaults to `type`.

  Example

  ```javascript
  App.Person = DS.Model.extend({
    name: MF.fragment('name', { defaultValue: {} })
  });

  App.Name = MF.Fragment.extend({
    first: DS.attr('string'),
    last: DS.attr('string')
  });
  ```

  @namespace MF
  @method fragment
  @param {String} type the fragment type
  @param {Object} options a hash of options
  @return {Attribute}
*/
function fragment(declaredModelName, options) {
  options = options || {};

  let metaType = metaTypeFor('fragment', declaredModelName, options);

  return fragmentProperty(metaType, options, declaredModelName);
}

/**
  `MF.fragmentArray` defines an attribute on a `DS.Model` or `MF.Fragment`.
  Much like `DS.hasMany`, it creates a property that returns an array of
  fragments of the given type. The array is aware of its original state and so
  has a `hasDirtyAttributes` property and a `rollback` method.

  It takes an optional hash as a second parameter, currently supported options
  are:

  - `defaultValue`: An array literal or a function to be called to set the
    attribute to a default value if none is supplied. Values are deep copied
    before being used. Note that default values will be passed through the
    fragment's serializer when creating the fragment. Defaults to an empty
    array.
  - `polymorphic`: Whether or not the fragments in the array can be child
    classes of the given type.
  - `typeKey`: If `polymorphic` is true, the property to use as the fragment
    type in the normalized data. Defaults to `type`.

  Example

  ```javascript
  App.Person = DS.Model.extend({
    addresses: MF.fragmentArray('address')
  });

  App.Address = MF.Fragment.extend({
    street: DS.attr('string'),
    city: DS.attr('string'),
    region: DS.attr('string'),
    country: DS.attr('string')
  });
  ```

  @namespace MF
  @method fragmentArray
  @param {String} type the fragment type (optional)
  @param {Object} options a hash of options
  @return {Attribute}
*/
function fragmentArray(modelName, options) {
  options || (options = {});

  let metaType = metaTypeFor('fragment-array', modelName, options);

  // fragmentArrayProperty takes type, options, modelName, isFragmentArray
  return fragmentArrayProperty(metaType, options, modelName, true);
}

/**
  `MF.array` defines an attribute on a `DS.Model` or `MF.Fragment`. It creates a
  property that returns an array of values of the given primitive type. The
  array is aware of its original state and so has a `hasDirtyAttributes`
  property and a `rollback` method.

  It takes an optional hash as a second parameter, currently supported options
  are:

  - `defaultValue`: An array literal or a function to be called to set the
    attribute to a default value if none is supplied. Values are deep copied
    before being used. Note that default values will be passed through the
    fragment's serializer when creating the fragment.

  Example

  ```javascript
  App.Person = DS.Model.extend({
    aliases: MF.array('string')
  });
  ```

  @namespace MF
  @method array
  @param {String} type the type of value contained in the array
  @param {Object} options a hash of options
  @return {Attribute}
*/
function array(type, options) {
  if (typeof type === 'object') {
    options = type;
    type = undefined;
  } else {
    options || (options = {});
  }

  let metaType = metaTypeFor('array', type);

  // fragmentArrayProperty takes type, options, modelName, isArray, isFragmentArray
  return fragmentArrayProperty(metaType, options, null, false);
}

function fragmentProperty(type, options, declaredModelName, isArray = false, isFragmentArray = false) {
  options = options || {};

  let meta = {
    type: type,
    isAttribute: true,
    isFragment: true,
    options: options
  };

  return computed({
    get(key) {
      let fragment;
      let internalModel = internalModelFor(this);
      if (isArray) {
        fragment = internalModel._recordData.getFragmentArray(key, options, declaredModelName, this, isFragmentArray);
      } else {
        fragment = internalModel._recordData.getFragment(key, options, declaredModelName, this);
      }
      return fragment;
    },
    set(key, value) {
      let fragment;
      let internalModel = internalModelFor(this);
      if (isArray) {
        fragment = internalModel._recordData.getFragmentArray(key, options, declaredModelName, this, isFragmentArray);
        fragment = internalModel._recordData.setFragmentArrayValue(key, fragment, value, this, declaredModelName, options, isFragmentArray);
      } else {
        fragment = internalModel._recordData.getFragment(key, options, declaredModelName, this);
        fragment = internalModel._recordData.setFragmentValue(key, fragment, value, this, declaredModelName, options);
      }
      return internalModel._recordData.fragments[key] = fragment;
    }
  }).meta(meta);
}

function fragmentArrayProperty(metaType, options, declaredModelName, isFragmentArray) {
  return fragmentProperty(metaType, options, declaredModelName, true, isFragmentArray);
}

/**
  `MF.fragmentOwner` defines a read-only attribute on a `MF.Fragment`
  instance. The attribute returns a reference to the fragment's owner
  record.

  Example

  ```javascript
  App.Person = DS.Model.extend({
    name: MF.fragment('name')
  });

  App.Name = MF.Fragment.extend({
    first: DS.attr('string'),
    last: DS.attr('string'),
    person: MF.fragmentOwner()
  });
  ```

  @namespace MF
  @method fragmentOwner
  @return {Attribute}
*/
function fragmentOwner() {
  return computed(function() {
    assert('Fragment owner properties can only be used on fragments.', isFragment(this));

    return internalModelFor(this)._recordData._owner;
  }).meta({
    isFragmentOwner: true
  }).readOnly();
}

export {
  fragment,
  fragmentArray,
  array,
  fragmentOwner
};
