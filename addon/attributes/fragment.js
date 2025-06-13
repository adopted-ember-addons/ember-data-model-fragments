import { assert } from '@ember/debug';
import { computed } from '@ember/object';
import { typeOf } from '@ember/utils';
// import { recordDataFor } from '@ember-data/store/-private';
import {
  getActualFragmentType,
  isFragment,
  setFragmentOwner,
} from '../fragment';
import metaTypeFor from '../util/meta-type-for';
import isInstanceOfType from '../util/instance-of-type';

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
export default function fragment(type, options) {
  options = options || {};

  const metaType = metaTypeFor('fragment', type, options);

  const meta = {
    modelName: type,
    type: metaType,
    isAttribute: true,
    isFragment: true,
    kind: 'fragment',
    options,
  };

  return computed({
    get(key) {
      const recordData = recordDataFor(this);
      const fragment = recordData.getFragment(key);
      if (fragment === null) {
        return null;
      }
      return fragment._fragmentGetRecord();
    },
    set(key, value) {
      assert(
        'You must pass a fragment or null to set a fragment',
        value === null || isFragment(value) || typeOf(value) === 'object',
      );
      const recordData = recordDataFor(this);
      if (value === null) {
        recordData.setDirtyFragment(key, null);
        return null;
      }
      if (isFragment(value)) {
        assert(
          `You can only set '${type}' fragments to this property`,
          isInstanceOfType(this.store.modelFor(type), value),
        );
        setFragmentOwner(value, recordData, key);
        recordData.setDirtyFragment(key, recordDataFor(value));
        return value;
      }
      const fragmentRecordData = recordData.getFragment(key);
      const actualType = getActualFragmentType(type, options, value, this);
      if (fragmentRecordData?.modelName !== actualType) {
        const fragment = this.store.createFragment(actualType, value);
        setFragmentOwner(fragment, recordData, key);
        recordData.setDirtyFragment(key, recordDataFor(fragment));
        return fragment;
      }
      const fragment = fragmentRecordData._fragmentGetRecord();
      fragment.setProperties(value);
      return fragment;
    },
  }).meta(meta);
}
