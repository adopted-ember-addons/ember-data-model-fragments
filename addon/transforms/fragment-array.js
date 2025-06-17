import Transform from '@ember-data/serializer/transform';
import { isPresent } from '@ember/utils';
import { getOwner } from '@ember/application';
import { TrackedArray } from 'tracked-built-ins';
import { copy } from '../util/copy';

/**
 * FragmentArray - A reactive array that contains fragment instances
 *
 * Extends TrackedArray from tracked-built-ins and adds:
 * - Fragment-specific methods (createFragment)
 * - Parent model notification when array changes
 * - Fragment-aware dirty tracking and rollback
 * - Serialization support
 */
class FragmentArray extends TrackedArray {
  constructor(content = [], owner = null, key = null, fragmentType = null) {
    super(content);

    this._owner = owner;
    this._key = key;
    this._fragmentType = fragmentType;
    this._originalContent = content.slice(); // Track original state for rollback
  }

  // Fragment-specific methods
  createFragment(data = {}) {
    const fragmentClass = this._getFragmentClass();
    const fragment = new fragmentClass(data, this._owner, this._key);
    this.push(fragment);
    this._notifyParentChange();
    return fragment;
  }

  // Override mutation methods to notify parent
  push(...items) {
    const result = super.push(...items);
    this._notifyParentChange();
    return result;
  }

  pop() {
    const result = super.pop();
    if (result !== undefined) {
      this._notifyParentChange();
    }
    return result;
  }

  shift() {
    const result = super.shift();
    if (result !== undefined) {
      this._notifyParentChange();
    }
    return result;
  }

  unshift(...items) {
    const result = super.unshift(...items);
    this._notifyParentChange();
    return result;
  }

  splice(start, deleteCount, ...items) {
    const result = super.splice(start, deleteCount, ...items);
    if (deleteCount > 0 || items.length > 0) {
      this._notifyParentChange();
    }
    return result;
  }

  // Additional Ember Array compatibility methods
  pushObject(obj) {
    this.push(obj);
    return this;
  }

  pushObjects(objects) {
    this.push(...objects);
    return this;
  }

  removeObject(obj) {
    const index = this.indexOf(obj);
    if (index > -1) {
      this.splice(index, 1);
    }
    return this;
  }

  removeObjects(objects) {
    objects.forEach((obj) => this.removeObject(obj));
    return this;
  }

  insertAt(index, obj) {
    this.splice(index, 0, obj);
    return this;
  }

  removeAt(index, len = 1) {
    return this.splice(index, len);
  }

  replace(index, removeCount, objects = []) {
    this.splice(index, removeCount, ...objects);
    return this;
  }

  clear() {
    this.splice(0, this.length);
    return this;
  }

  // Utility methods
  get firstObject() {
    return this[0];
  }

  get lastObject() {
    return this[this.length - 1];
  }

  objectAt(index) {
    return this[index];
  }

  // Serialization
  serialize() {
    return this.map((fragment) => {
      if (fragment && typeof fragment.serialize === 'function') {
        return fragment.serialize();
      }
      return fragment;
    });
  }

  // Dirty tracking
  get hasDirtyAttributes() {
    // Check if array length changed
    if (this.length !== this._originalContent.length) {
      return true;
    }

    // Check if any fragments are dirty
    return this.some((fragment) => {
      return fragment && fragment.hasDirtyAttributes;
    });
  }

  get changedAttributes() {
    // For arrays, we return a simplified change object
    if (this.hasDirtyAttributes) {
      return {
        [this._key]: [this._originalContent.slice(), this.slice()],
      };
    }
    return {};
  }

  rollbackAttributes() {
    // Rollback individual fragments first
    this.forEach((fragment) => {
      if (fragment && typeof fragment.rollbackAttributes === 'function') {
        fragment.rollbackAttributes();
      }
    });

    // Restore original array contents
    this.splice(0, this.length, ...this._originalContent);
    this._notifyParentChange();
  }

  // Private methods
  _getFragmentClass() {
    if (this._owner && this._owner.store && this._fragmentType) {
      return this._owner.store.modelFor(this._fragmentType);
    }

    // Try to get from Ember's container
    const owner = getOwner(this._owner);
    if (owner && this._fragmentType) {
      const factory = owner.factoryFor(`model:${this._fragmentType}`);
      if (factory && factory.class) {
        return factory.class;
      }
    }

    throw new Error(
      `Could not find fragment class for type: ${this._fragmentType}`,
    );
  }

  _notifyParentChange() {
    if (this._owner && this._key) {
      // Notify parent model of change
      if (typeof this._owner.notifyPropertyChange === 'function') {
        this._owner.notifyPropertyChange(this._key);
        this._owner.notifyPropertyChange('hasDirtyAttributes');
      }
    }
  }

  // Update original content when parent model is saved/committed
  _updateOriginalContent() {
    this._originalContent = this.slice();
  }
}

export default class FragmentArrayTransform extends Transform {
  deserialize(serialized, options = {}, record = null, key = null) {
    if (!isPresent(serialized)) {
      return this._getDefaultValue(options, record, key);
    }

    const fragmentType = options.fragmentType;
    if (!fragmentType) {
      throw new Error('Fragment array transform requires fragmentType option');
    }

    const fragmentClass = this._getFragmentClass(fragmentType, record);

    // Create fragment instances from serialized data
    const fragments = serialized.map((data) => {
      return new fragmentClass(data, record, key);
    });

    return new FragmentArray(fragments, record, key, fragmentType);
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
