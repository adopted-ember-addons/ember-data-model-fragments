import Transform from '@ember-data/serializer/transform';
import { isPresent } from '@ember/utils';
import { getOwner } from '@ember/application';
import { copy } from '../util/copy';
import Fragment from '../fragment';

import { inject as service } from '@ember/service';

export default class FragmentTransform extends Transform {
  @service store;
  // We're going to override the init method to force a debug message on instantiation
  init() {
    super.init(...arguments);
    console.log('TRANSFORM: FragmentTransform instance created!', this);
  }

  deserialize(serialized, options = {}, record = null, key = null) {
    console.log('TRANSFORM: Fragment deserialize called', {
      serialized,
      options,
      recordType: record && record.constructor.modelName,
      key
    });
    
    if (!isPresent(serialized)) {
      return this._getDefaultValue(options, record, key);
    }

    const fragmentType = options.fragmentType;
    if (!fragmentType) {
      throw new Error('Fragment transform requires fragmentType option');
    }

    try {
      // Get the fragment class directly
      const FragmentClass = this._getFragmentClass(fragmentType, record);
      console.log('TRANSFORM: Found FragmentClass', {
        name: FragmentClass.name,
        isFragment: Fragment.detect(FragmentClass),
      });

      // Create the fragment instance directly
      const fragment = new FragmentClass(serialized, record, key);

      console.log('TRANSFORM: Created fragment', {
        isFragment: fragment instanceof Fragment,
        attributes: fragment._attributes,
        hasSetMethod: typeof fragment.set === 'function',
      });

      return fragment;
    } catch (e) {
      console.error('TRANSFORM: Error creating fragment:', e);
      throw e;
    }
  }

  serialize(fragment, options = {}) {
    console.log('TRANSFORM: Fragment serialize called', {
      fragment,
      options,
    });
    
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
    let FragmentClass = null;

    // Try to get from record's store first
    if (record && record.store) {
      try {
        FragmentClass = record.store.modelFor(fragmentType);
      } catch (e) {
        // Fall through to container lookup
      }
    }

    // Try to get from Ember's container
    if (!FragmentClass) {
      const owner = getOwner(record) || getOwner(this);
      if (owner) {
        const factory = owner.factoryFor(`model:${fragmentType}`);
        if (factory && factory.class) {
          FragmentClass = factory.class;
        }
      }
    }

    if (!FragmentClass) {
      throw new Error(
        `Could not find fragment class for type: ${fragmentType}. Make sure the fragment model is defined at app/models/${fragmentType}.js`,
      );
    }

    // Verify this is really a Fragment class
    if (!Fragment.detect(FragmentClass)) {
      console.warn(`Model ${fragmentType} is not a Fragment class!`);
    }

    return FragmentClass;
  }

  _getDefaultValue(options, record, key) {
    const defaultValue = options.defaultValue;

    // For function defaultValues (preferred approach)
    if (typeof defaultValue === 'function') {
      const value = defaultValue();

      // Create fragment from returned data if needed
      if (value && options.fragmentType) {
        try {
          const fragmentClass = this._getFragmentClass(
            options.fragmentType,
            record,
          );
          return new fragmentClass(value, record, key);
        } catch (e) {
          // If we can't create the fragment, return the raw value
          return value;
        }
      }

      return value;
    }

    // For object defaultValues - Ember Data complains about these but we support for backward compatibility
    if (defaultValue !== undefined) {
      // For primitive default values, just return them
      if (defaultValue === null || typeof defaultValue !== 'object') {
        return defaultValue;
      }

      // For object defaults, wrap in a function to avoid sharing references
      // This is necessary because Ember Data warns about shared references in defaultValues
      const wrappedDefault = () => copy(defaultValue, true);
      return this._getDefaultValue(
        { ...options, defaultValue: wrappedDefault },
        record,
        key,
      );
    }

    return null;
  }
}
