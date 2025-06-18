import { TrackedArray } from 'tracked-built-ins';
import { getOwner } from '@ember/application';
import { A } from '@ember/array';
import EmberArray from '@ember/array';
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
export default class FragmentArray extends TrackedArray {
  constructor(content = [], owner = null, key = null, fragmentType = null) {
    super(content);

    this._owner = owner;
    this._key = key;
    this._fragmentType = fragmentType;
    this._originalContent = copy(content, true); // Track original state for rollback with deep copy
    
    // Add required Ember Array compatibility
    this.isEmberArray = true;
    
    // Fix for instanceof checks - ensure the prototype chain is properly set
    Object.setPrototypeOf(this, FragmentArray.prototype);
  }
  
  // Ember.Array compatibility - get method for property access
  get(key) {
    // Special cases for array properties accessed via get
    if (key === 'firstObject') return this.firstObject;
    if (key === 'lastObject') return this.lastObject;
    if (key === 'length') return this.length;
    if (key === 'hasDirtyAttributes') return this.hasDirtyAttributes;
    
    // Handle numeric indices
    if (!isNaN(parseInt(key, 10))) {
      return this[parseInt(key, 10)];
    }
    
    // Support getters directly on the prototype
    if (typeof this[key] === 'function') {
      return this[key].bind(this);
    }
    
    // Handle other properties
    return this[key];
  }
  
  // Ember.Array compatibility - set method for property access
  set(key, value) {
    return this.setUnknownProperty(key, value);
  }
  
  setUnknownProperty(key, value) {
    if (!isNaN(parseInt(key, 10))) {
      this[parseInt(key, 10)] = value;
    } else {
      this[key] = value;
    }
    this._notifyParentChange();
    return value;
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
    // Store indices to remove in reverse order to avoid shifting issues
    const indices = [];
    objects.forEach((obj) => {
      // Find all indices of the object to remove
      let idx = this.indexOf(obj);
      while (idx !== -1) {
        indices.push(idx);
        idx = this.indexOf(obj, idx + 1);
      }
    });
    
    // Sort indices in descending order to avoid shifting issues
    indices.sort((a, b) => b - a);
    
    // Remove each item at the stored indices
    indices.forEach((idx) => {
      this.splice(idx, 1);
    });
    
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
    if (!Array.isArray(objects)) {
      objects = [objects];
    }
    this.splice(index, removeCount, ...objects);
    return this;
  }

  clear() {
    this.splice(0, this.length);
    return this;
  }
  
  // Add these methods for EmberArray compatibility
  mapBy(key) {
    return this.map(item => {
      if (item && typeof item === 'object') {
        // Use get method if available, otherwise direct property access
        return typeof item.get === 'function' ? item.get(key) : item[key];
      }
      return undefined;
    });
  }
  
  findBy(key, value) {
    return this.find(item => {
      if (item && typeof item === 'object') {
        // Use get method if available, otherwise direct property access
        const itemValue = typeof item.get === 'function' ? item.get(key) : item[key];
        return itemValue === value;
      }
      return false;
    });
  }
  
  filterBy(key, value) {
    return this.filter(item => {
      if (item && typeof item === 'object') {
        // Use get method if available, otherwise direct property access
        const itemValue = typeof item.get === 'function' ? item.get(key) : item[key];
        if (value === undefined) {
          return Boolean(itemValue);
        }
        return itemValue === value;
      }
      return false;
    });
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
  
  // Ember compatibility for enumerable
  forEach(callback, thisArg) {
    return Array.prototype.forEach.call(this, callback, thisArg);
  }
  
  toArray() {
    return Array.prototype.slice.call(this);
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
