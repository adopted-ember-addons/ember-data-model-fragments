import { assert } from '@ember/debug';
import { computed } from '@ember/object';
import { typeOf } from '@ember/utils';
import { recordIdentifierFor } from '@ember-data/store';
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

  return computed('store.{_instanceCache,cache}', {
    get(key) {
      const identifier = recordIdentifierFor(this);
      const cache = this.store.cache;
      const fragmentIdentifier = cache.getFragment(identifier, key);
      if (fragmentIdentifier === null) {
        return null;
      }
      // Get the fragment record from the identifier
      return this.store._instanceCache.getRecord(fragmentIdentifier);
    },
    set(key, value) {
      assert(
        'You must pass a fragment or null to set a fragment',
        value === null || isFragment(value) || typeOf(value) === 'object',
      );
      const identifier = recordIdentifierFor(this);
      const cache = this.store.cache;
      if (value === null) {
        cache.setDirtyFragment(identifier, key, null);
        return null;
      }
      if (isFragment(value)) {
        assert(
          `You can only set '${type}' fragments to this property`,
          isInstanceOfType(this.store.modelFor(type), value),
        );
        const fragmentIdentifier = recordIdentifierFor(value);
        setFragmentOwner(value, identifier, key);
        cache.setDirtyFragment(identifier, key, fragmentIdentifier);
        return value;
      }
      // Value is a plain object - update existing fragment or create new one
      const fragmentIdentifier = cache.getFragment(identifier, key);
      const actualType = getActualFragmentType(type, options, value, this);
      if (fragmentIdentifier?.type !== actualType) {
        // Create a new fragment
        const fragment = this.store.createFragment(actualType, value);
        const newFragmentIdentifier = recordIdentifierFor(fragment);
        setFragmentOwner(fragment, identifier, key);
        cache.setDirtyFragment(identifier, key, newFragmentIdentifier);
        return fragment;
      }
      // Update existing fragment
      const fragment = this.store._instanceCache.getRecord(fragmentIdentifier);
      fragment.setProperties(value);
      return fragment;
    },
  }).meta(meta);
}
