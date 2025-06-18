import { tracked } from '@glimmer/tracking';
import { computed, get as emberGet, set as emberSet } from '@ember/object';
import { defineProperty } from '@ember/object';
import { getOwner } from '@ember/application';
import { copy } from './util/copy';
import { isPresent } from '@ember/utils';

export default class Fragment {
  @tracked _attributes = {};
  @tracked _owner = null;
  @tracked _key = null;
  @tracked _originalAttributes = {};

  // Static properties that will be set by subclasses
  static modelName = null;
  static attributes = {};

  constructor(data = {}, owner = null, key = null) {
    // Initialize all tracked properties
    this._attributes = {};
    this._owner = owner;
    this._key = key;
    this._originalAttributes = {};

    // Setup attribute definitions as computed properties
    this._setupAttributeProperties();

    // Set initial data
    this._setInitialData(data);

    // Track original state for dirty checking
    this._originalAttributes = copy(this._attributes, true);
    
    // Debug constructor execution
    console.log('Fragment constructor executed for', this.constructor.modelName);
    console.log('Initial attributes:', this._attributes);
  }

  /**
   * This is the critical compatibility method that makes fragments work with Ember.
   * It allows setting properties both via fragment.set('key', value) and directly.
   * @param {string|object} keyOrObject - Either a key to set or an object of key/values
   * @param {*} value - The value to set (if key is a string)
   * @returns {*} The value that was set
   */
  set(keyOrObject, value) {
    // Handle both set(key, value) and set({ key: value }) forms
    if (typeof keyOrObject === 'object' && value === undefined) {
      // Handle set({ key: value }) form
      Object.keys(keyOrObject).forEach(key => {
        this.setUnknownProperty(key, keyOrObject[key]);
      });
      return this;
    }
    
    // Handle set(key, value) form - standard case
    const key = keyOrObject;
    
    // Support for nested paths like 'name.first'
    if (key && key.includes && key.includes('.')) {
      return emberSet(this, key, value);
    }
    
    return this.setUnknownProperty(key, value);
  }

  _setupAttributeProperties() {
    const attributes = this.constructor.attributes || {};

    Object.keys(attributes).forEach((key) => {
      const meta = attributes[key];

      // Define direct property access with a getter/setter
      Object.defineProperty(this, key, {
        get() {
          return this._attributes[key];
        },
        set(value) {
          return this.setUnknownProperty(key, value);
        },
        enumerable: true,
        configurable: true
      });
    });
  }
  
  // Make sure the class is compatible with Ember's expectedAttributes
  static eachAttribute(callback) {
    const attributes = this.attributes || {};
    Object.keys(attributes).forEach((key) => {
      callback(key, attributes[key]);
    });
  }

  _setInitialData(data) {
    // Ensure _attributes is initialized
    if (!this._attributes) {
      this._attributes = {};
    }
    
    // Set each attribute from the data
    Object.keys(data || {}).forEach((key) => {
      // Use setUnknownProperty to ensure proper change tracking
      this.setUnknownProperty(key, data[key]);
    });
  }

  // Public API methods (maintain backward compatibility)
  // Support both direct property access and get() method for compatibility
  get(key) {
    if (key === undefined || key === null) {
      return undefined;
    }

    // Support for nested paths like 'name.first' that tests might use
    if (key.includes && key.includes('.')) {
      return emberGet(this, key);
    }

    // First try the attributes
    if (this._attributes[key] !== undefined) {
      return this._attributes[key];
    }
    
    // Then try direct property access
    return this[key];
  }


  setUnknownProperty(key, value) {
    // Ensure attributes exists
    if (!this._attributes) {
      this._attributes = {};
    }
    
    const oldValue = this._attributes[key];
    
    // Set the value in _attributes
    this._attributes[key] = value;
    
    // Use Object.defineProperty to avoid triggering the setter again
    if (!Object.getOwnPropertyDescriptor(this, key)) {
      Object.defineProperty(this, key, {
        enumerable: true,
        configurable: true,
        get() { 
          return this._attributes[key]; 
        },
        set(newValue) { 
          this.setUnknownProperty(key, newValue);
          return newValue;
        }
      });
    } else {
      // If using defineProperty directly to bypass the setter 
      // to avoid the infinite recursion
      Object.defineProperty(this, key, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: value
      });
    }

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
    const store = getOwner(this)?.lookup('service:store');

    if (store) {
      try {
        return store.serializerFor(modelName);
      } catch (e) {
        // Fall through to default serializer
        console.warn(`Could not find serializer for fragment type: ${modelName}`, e);
      }
    }

    // Fallback serializer - just return attributes
    return {
      serialize: (fragment) => {
        // Direct serialization of attributes
        const result = {};
        Object.keys(fragment._attributes || {}).forEach((key) => {
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
  
  // Static method to detect if a class is a Fragment
  static detect(klass) {
    return klass === Fragment || 
           (klass && klass.prototype instanceof Fragment);
  }
  
  // RecordData interface compatibility methods - for Ember Data integration
  getAttr(key) {
    return this.get(key);
  }
  
  setAttr(key, value) {
    return this.set(key, value);
  }
  
  // Support for Ember.get compatibility
  unknownProperty(key) {
    return this.get(key);
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
