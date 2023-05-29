import { computed } from '@ember/object';
import { isArray } from '@ember/array';
import { assert } from '@ember/debug';
import { recordDataFor } from '@ember-data/store/-private';
import metaTypeFor from '../util/meta-type-for';
import StatefulArray from '../array/stateful';

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
export default function array(type, options) {
  if (typeof type === 'object') {
    options = type;
    type = undefined;
  } else {
    options || (options = {});
  }

  const metaType = metaTypeFor('array', type);

  const meta = {
    arrayTransform: type,
    type: metaType,
    isAttribute: true,
    isFragment: true,
    kind: 'array',
    options,
  };

  // eslint-disable-next-line ember/require-computed-property-dependencies
  return computed({
    get(key) {
      const recordData = recordDataFor(this);
      if (recordData.getFragment(key) === null) {
        return null;
      }
      let array = recordData._fragmentArrayCache[key];
      if (!array) {
        array = StatefulArray.create({
          store: this.store,
          recordData,
          key,
        });
        recordData._fragmentArrayCache[key] = array;
      }
      return array;
    },
    set(key, value) {
      assert(
        'You must pass an array or null to set an array',
        value === null || isArray(value)
      );
      const recordData = recordDataFor(this);
      if (value === null) {
        recordData.setDirtyFragment(key, null);
        return null;
      }
      recordData.setDirtyFragment(key, value.slice());
      let array = recordData._fragmentArrayCache[key];
      if (!array) {
        array = StatefulArray.create({
          store: this.store,
          recordData,
          key,
        });
        recordData._fragmentArrayCache[key] = array;
      }
      array._setFragments(value);
      return array;
    },
  }).meta(meta);
}
