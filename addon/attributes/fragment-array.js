import { assert } from '@ember/debug';
import { computed } from '@ember/object';
import { typeOf } from '@ember/utils';
import { isArray } from '@ember/array';
import { recordDataFor } from '@ember-data/store/-private';
import { isFragment, setFragmentOwner } from '../fragment';
import metaTypeFor from '../util/meta-type-for';
import FragmentArray from '../array/fragment';
import { copy } from 'ember-copy';

function getDefaultValue(record, options, key) {
  if (typeof options.defaultValue === 'function') {
    const defaultValue = options.defaultValue.call(null, record, options, key);
    assert(
      'The fragment array\'s default value function must return an array of fragments',
      defaultValue === null || (isArray(defaultValue) && defaultValue.every(v => isFragment(v) || typeOf(v) === 'object'))
    );
    return defaultValue;
  }
  if (options.defaultValue !== undefined) {
    const defaultValue = options.defaultValue;
    assert(
      'The fragment array\'s default value must be an array of objects',
      defaultValue === null || (isArray(defaultValue) && defaultValue.every(v => typeOf(v) === 'object'))
    );
    // Create a deep copy of the resulting value to avoid shared reference errors
    return copy(defaultValue, true);
  }
  return [];
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
export default function fragmentArray(type, options) {
  options = options || {};

  const metaType = metaTypeFor('fragment-array', type, options);

  const meta = {
    modelName: type,
    type: metaType,
    isAttribute: true,
    isFragment: true,
    kind: 'fragment-array',
    options
  };

  // eslint-disable-next-line ember/require-computed-property-dependencies
  return computed({
    get(key) {
      const recordData = recordDataFor(this);
      if (!recordData.hasFragment(key)) {
        const defaultValue = getDefaultValue(this, options, key);
        if (defaultValue === null) {
          recordData._fragmentData[key] = null;
          return null;
        }
        recordData._fragmentData[key] = defaultValue.map(dv => {
          const fragment = isFragment(dv) ? dv : this.store.createFragment(type, dv);
          setFragmentOwner(fragment, recordData, key);
          return recordDataFor(fragment);
        });
      }
      if (recordData.getFragment(key) === null) {
        return null;
      }
      let fragmentArray = recordData._fragmentArrayCache[key];
      if (!fragmentArray) {
        fragmentArray = FragmentArray.create({
          modelName: type,
          store: this.store,
          recordData,
          key
        });
        recordData._fragmentArrayCache[key] = fragmentArray;
      }
      return fragmentArray;
    },
    set(key, value) {
      assert(
        'You must pass an array of fragments, or null to set a fragmentArray',
        value === null || (isArray(value) && value.every(v => isFragment(v) || typeOf(v) === 'object'))
      );
      const recordData = recordDataFor(this);
      if (!recordData.hasFragment(key)) {
        const defaultValue = getDefaultValue(this, options, key);
        if (defaultValue === null) {
          recordData._fragmentData[key] = null;
        } else {
          recordData._fragmentData[key] = defaultValue.map(dv => {
            const fragment = isFragment(dv) ? dv : this.store.createFragment(type, dv);
            setFragmentOwner(fragment, recordData, key);
            return recordDataFor(fragment);
          });
        }
      }
      if (value === null) {
        recordData.setDirtyFragment(key, null);
        return null;
      }
      let fragmentArray = recordData._fragmentArrayCache[key];
      if (!fragmentArray) {
        fragmentArray = FragmentArray.create({
          modelName: type,
          store: this.store,
          recordData,
          key
        });
        recordData._fragmentArrayCache[key] = fragmentArray;
      }
      fragmentArray.setObjects(value);
      return fragmentArray;
    }
  }).meta(meta);
}
