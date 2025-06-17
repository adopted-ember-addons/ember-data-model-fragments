import Transform from '@ember-data/serializer/transform';
import { isPresent } from '@ember/utils';
import { getOwner } from '@ember/application';
import { copy } from './util/copy';

export default class FragmentTransform extends Transform {
  deserialize(serialized, options = {}, record = null, key = null) {
    if (!isPresent(serialized)) {
      return this._getDefaultValue(options, record, key);
    }

    const fragmentType = options.fragmentType;
    if (!fragmentType) {
      throw new Error('Fragment transform requires fragmentType option');
    }

    const fragmentClass = this._getFragmentClass(fragmentType, record);
    return new fragmentClass(serialized, record, key);
  }

  serialize(fragment, options = {}) {
    if (!isPresent(fragment)) {
      return null;
    }

    // Use fragment's serialize method if available
    if (typeof fragment.serialize === 'function') {
      return fragment.serialize();
    }

    // Fallback - just return the attributes
    if (fragment._attributes) {
      return copy(fragment._attributes, true);
    }

    return fragment;
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
      return defaultValue();
    }

    if (defaultValue !== undefined) {
      // Deep copy to avoid shared references
      const copied = copy(defaultValue, true);

      // If we have a fragment type, create a proper fragment instance
      if (options.fragmentType) {
        try {
          const fragmentClass = this._getFragmentClass(
            options.fragmentType,
            record,
          );
          return new fragmentClass(copied, record, key);
        } catch (e) {
          // If we can't create the fragment, just return the copied value
          return copied;
        }
      }

      return copied;
    }

    return null;
  }
}
