import { tracked } from '@glimmer/tracking';
import { computed } from '@ember/object';
import { defineProperty } from '@ember/object';
import { getOwner } from '@ember/application';
import { copy } from './util/copy';

export default class Fragment {
  @tracked _attributes = {};
  @tracked _owner = null;
  @tracked _key = null;
  @tracked _originalAttributes = {};

  // Static properties that will be set by subclasses
  static modelName = null;
  static attributes = {};

  constructor(data = {}, owner = null, key = null) {
    this._owner = owner;
    this._key = key;

    // Setup attribute definitions as computed properties
    this._setupAttributeProperties();

    // Set initial data
    this._setInitialData(data);

    // Track original state for dirty checking
    this._originalAttributes = copy(this._attributes, true);
  }

  _setupAttributeProperties() {
    const attributes = this.constructor.attributes || {};

    Object.keys(attributes).forEach((key) => {
      const meta = attributes[key];

      defineProperty(
        this,
        key,
        computed({
          get() {
            return this._attributes[key];
          },
          set(key, value) {
            return this.setUnknownProperty(key, value);
          },
        }),
      );
    });
  }

  _setInitialData(data) {
    Object.keys(data).forEach((key) => {
      this._attributes[key] = data[key];
    });
  }

  // Public API methods (maintain backward compatibility)
  get(key) {
    return this._attributes[key];
  }

  set(key, value) {
    return this.setUnknownProperty(key, value);
  }

  setUnknownProperty(key, value) {
    const oldValue = this._attributes[key];
    this._attributes[key] = value;

    if (oldValue !== value) {
      this._fragmentDidChange();
    }

    return value;
  }

  // Dirty tracking (maintain existing API)
  get hasDirtyAttributes() {
    return Object.keys(this._attributes).some((key) => {
      const current = this._attributes[key];
      const original = this._originalAttributes[key];

      // Handle nested fragments/arrays
      if (current && typeof current.hasDirtyAttributes === 'boolean') {
        return current.hasDirtyAttributes;
      }

      return current !== original;
    });
  }

  get changedAttributes() {
    const changed = {};

    Object.keys(this._attributes).forEach((key) => {
      const current = this._attributes[key];
      const original = this._originalAttributes[key];

      if (current !== original) {
        changed[key] = [original, current];
      }
    });

    return changed;
  }

  rollbackAttributes() {
    Object.keys(this._originalAttributes).forEach((key) => {
      const original = this._originalAttributes[key];

      // Handle nested fragments
      const current = this._attributes[key];
      if (current && typeof current.rollbackAttributes === 'function') {
        current.rollbackAttributes();
      } else {
        this._attributes[key] = copy(original, true);
      }
    });

    this._fragmentDidChange();
  }

  // Serialization
  serialize(options = {}) {
    const serializer = this._getSerializer();
    return serializer.serialize(this, options);
  }

  _getSerializer() {
    const modelName = this.constructor.modelName;

    // Try to get serializer from owner record's store
    if (this._owner && this._owner.store) {
      try {
        return this._owner.store.serializerFor(modelName);
      } catch (e) {
        // Fall through to default serializer
      }
    }

    // Try to get serializer from Ember's container
    const owner = getOwner(this._owner) || getOwner(this);
    if (owner) {
      try {
        return (
          owner.lookup(`serializer:${modelName}`) ||
          owner.lookup('serializer:application') ||
          owner.lookup('serializer:-default')
        );
      } catch (e) {
        // Fall through to fallback
      }
    }

    // Fallback serializer - just return attributes
    return {
      serialize: (fragment) => {
        const result = {};
        Object.keys(fragment._attributes).forEach((key) => {
          const value = fragment._attributes[key];

          // Handle nested fragments/arrays
          if (value && typeof value.serialize === 'function') {
            result[key] = value.serialize();
          } else {
            result[key] = value;
          }
        });
        return result;
      },
    };
  }

  // Change notification
  _fragmentDidChange() {
    if (this._owner && this._key) {
      // Notify parent model of change
      if (typeof this._owner.notifyPropertyChange === 'function') {
        this._owner.notifyPropertyChange(this._key);
        this._owner.notifyPropertyChange('hasDirtyAttributes');
      }
    }
  }

  // Static method for declaring attributes (used by attr decorator)
  static attr(type, options = {}) {
    return function (target, key) {
      // Ensure attributes object exists on the prototype
      if (!target.constructor.attributes) {
        target.constructor.attributes = {};
      }

      target.constructor.attributes[key] = { type, options };
    };
  }

  // Helper method to iterate over attributes (like DS.Model.eachAttribute)
  eachAttribute(callback) {
    const attributes = this.constructor.attributes || {};
    Object.keys(attributes).forEach((key) => {
      callback(key, attributes[key]);
    });
  }
}

// Export attr for convenience (maintains existing import pattern)
export const attr = Fragment.attr;
