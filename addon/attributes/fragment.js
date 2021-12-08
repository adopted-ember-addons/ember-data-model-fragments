import { assert } from '@ember/debug';
import { computed } from '@ember/object';
import { typeOf } from '@ember/utils';
import { recordDataFor } from '@ember-data/store/-private';
import { copy } from 'ember-copy';
import { isFragment, setFragmentOwner } from '../fragment';
import metaTypeFor from '../util/meta-type-for';
import isInstanceOfType from '../util/instance-of-type';

function getDefaultValue(record, options, key) {
  if (typeof options.defaultValue === 'function') {
    const defaultValue = options.defaultValue.call(null, record, options, key);
    assert(
      'The fragment\'s default value must be an object',
      defaultValue === null || typeOf(defaultValue) === 'object' || isFragment(defaultValue)
    );
    return defaultValue;
  }
  if (options.defaultValue !== undefined) {
    const defaultValue = options.defaultValue;
    assert(
      'The fragment\'s default value function must return an object',
      defaultValue === null || typeOf(defaultValue) === 'object'
    );
    // Create a deep copy of the resulting value to avoid shared reference errors
    return copy(defaultValue, true);
  }
  return null;
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
export default function fragment(type, options) {
  options = options || {};

  const metaType = metaTypeFor('fragment', type, options);

  const meta = {
    modelName: type,
    type: metaType,
    isAttribute: true,
    isFragment: true,
    kind: 'fragment',
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
        const fragment = isFragment(defaultValue) ? defaultValue : this.store.createFragment(type, defaultValue);
        setFragmentOwner(fragment, recordData, key);
        recordData._fragmentData[key] = recordDataFor(fragment);
        return fragment;
      }
      const fragment = recordData.getFragment(key);
      if (fragment === null) {
        return null;
      }
      const internalModel = this.store._internalModelForResource(fragment.identifier);
      return internalModel.getRecord();
    },
    set(key, value) {
      assert(
        'You must pass a fragment or null to set a fragment',
        value === null || isFragment(value) || typeOf(value) === 'object'
      );
      const recordData = recordDataFor(this);
      if (!recordData.hasFragment(key)) {
        const defaultValue = getDefaultValue(this, options, key);
        if (defaultValue === null) {
          recordData._fragmentData[key] = null;
        } else {
          const fragment = isFragment(defaultValue) ? defaultValue : this.store.createFragment(type, defaultValue);
          setFragmentOwner(fragment, recordData, key);
          recordData._fragmentData[key] = recordDataFor(fragment);
        }
      }
      if (value === null) {
        recordData.setDirtyFragment(key, null);
        return null;
      }
      if (isFragment(value)) {
        assert(
          `You can only set '${type}' fragments to this property`,
          isInstanceOfType(this.store.modelFor(type), value)
        );
        setFragmentOwner(value, recordData, key);
        recordData.setDirtyFragment(key, recordDataFor(value));
        return value;
      }
      const fragmentRecordData = recordData.getFragment(key);
      if (fragmentRecordData === null) {
        const fragment = this.store.createFragment(type, value);
        setFragmentOwner(fragment, recordData, key);
        recordData._fragmentData[key] = recordDataFor(fragment);
        return fragment;
      }
      const fragment = this.store._internalModelForResource(fragmentRecordData.identifier).getRecord();
      fragment.setProperties(value);
      return fragment;
    }
  }).meta(meta);
}
