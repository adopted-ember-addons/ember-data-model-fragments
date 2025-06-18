import Transform from '@ember-data/serializer/transform';
import { isPresent } from '@ember/utils';
import { getOwner } from '@ember/application';
import { copy } from '../util/copy';
import FragmentArray from '../array/fragment';

import { inject as service } from '@ember/service';

export default class FragmentArrayTransform extends Transform {
  @service store;
  deserialize(serialized, options = {}, record = null, key = null) {
    if (!isPresent(serialized)) {
      return this._getDefaultValue(options, record, key);
    }

    const fragmentType = options.fragmentType;
    if (!fragmentType) {
      throw new Error('Fragment array transform requires fragmentType option');
    }

    try {
      // Create fragment instances from serialized data using the store service
      const fragments = serialized.map((data) => {
        const fragment = this.store.createFragment(fragmentType, data);
        // Set owner and key after creation to link it to the parent
        fragment._owner = record;
        fragment._key = key;
        return fragment;
      });

      return new FragmentArray(fragments, record, key, fragmentType);
    } catch (e) {
      console.error('Error creating fragment array:', e);
      throw e;
    }
  }

  serialize(fragmentArray, options = {}) {
    if (!isPresent(fragmentArray)) {
      return [];
    }

    // Use array's serialize method if available
    if (typeof fragmentArray.serialize === 'function') {
      return fragmentArray.serialize();
    }

    // Fallback - serialize each item
    if (Array.isArray(fragmentArray)) {
      return fragmentArray.map((fragment) => {
        if (fragment && typeof fragment.serialize === 'function') {
          return fragment.serialize();
        } else if (fragment && fragment._attributes) {
          return copy(fragment._attributes, true);
        }
        return fragment;
      });
    }

    return [];
  }

  _getFragmentClass(fragmentType, record) {
    // Try to get from record's store first
    if (record && record.store) {
      try {
        return record.store.modelFor(fragmentType);
      } catch (e) {
        // Fall through to container lookup
      }
    }

    // Try to get from Ember's container
    const owner = getOwner(record) || getOwner(this);
    if (owner) {
      const factory = owner.factoryFor(`model:${fragmentType}`);
      if (factory && factory.class) {
        return factory.class;
      }
    }

    throw new Error(
      `Could not find fragment class for type: ${fragmentType}. Make sure the fragment model is defined at app/models/${fragmentType}.js`,
    );
  }

  _getDefaultValue(options, record, key) {
    const defaultValue = options.defaultValue;

    if (typeof defaultValue === 'function') {
      const value = defaultValue();
      return new FragmentArray(value || [], record, key, options.fragmentType);
    }

    if (Array.isArray(defaultValue)) {
      // If default value contains objects, create fragments from them
      if (
        options.fragmentType &&
        defaultValue.length > 0 &&
        typeof defaultValue[0] === 'object'
      ) {
        try {
          const fragmentClass = this._getFragmentClass(
            options.fragmentType,
            record,
          );
          const fragments = defaultValue.map((data) => {
            return new fragmentClass(data, record, key);
          });
          return new FragmentArray(
            fragments,
            record,
            key,
            options.fragmentType,
          );
        } catch (e) {
          // If we can't create fragments, just use the raw data
          return new FragmentArray(
            copy(defaultValue, true),
            record,
            key,
            options.fragmentType,
          );
        }
      }

      return new FragmentArray(
        copy(defaultValue, true),
        record,
        key,
        options.fragmentType,
      );
    }

    if (defaultValue !== undefined) {
      return new FragmentArray(
        [defaultValue],
        record,
        key,
        options.fragmentType,
      );
    }

    // Default to empty array
    return new FragmentArray([], record, key, options.fragmentType);
  }
}

// Export the FragmentArray class for use in tests
export { FragmentArray };
