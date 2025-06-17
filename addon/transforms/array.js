import Transform from '@ember-data/serializer/transform';
import { isPresent } from '@ember/utils';
import { TrackedArray } from 'tracked-built-ins';
import { copy } from '../util/copy';

/**
 * PrimitiveArray - A reactive array for primitive values (strings, numbers, etc.)
 *
 * Extends TrackedArray from tracked-built-ins and adds:
 * - Parent model notification when array changes
 * - Dirty tracking and rollback support
 * - Type coercion for array items
 */
class PrimitiveArray extends TrackedArray {
  constructor(content = [], owner = null, key = null, itemType = null) {
    super(content);

    this._owner = owner;
    this._key = key;
    this._itemType = itemType;
    this._originalContent = content.slice();
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

  // Ember Array compatibility methods
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
    return this.slice();
  }

  // Dirty tracking
  get hasDirtyAttributes() {
    if (this.length !== this._originalContent.length) {
      return true;
    }

    return this.some((value, index) => {
      return value !== this._originalContent[index];
    });
  }

  get changedAttributes() {
    if (this.hasDirtyAttributes) {
      return {
        [this._key]: [this._originalContent.slice(), this.slice()],
      };
    }
    return {};
  }

  rollbackAttributes() {
    this.splice(0, this.length, ...this._originalContent);
    this._notifyParentChange();
  }

  _notifyParentChange() {
    if (this._owner && this._key) {
      if (typeof this._owner.notifyPropertyChange === 'function') {
        this._owner.notifyPropertyChange(this._key);
        this._owner.notifyPropertyChange('hasDirtyAttributes');
      }
    }
  }

  _updateOriginalContent() {
    this._originalContent = this.slice();
  }
}

export default class ArrayTransform extends Transform {
  deserialize(serialized, options = {}, record = null, key = null) {
    if (!isPresent(serialized)) {
      return this._getDefaultValue(options, record, key);
    }

    if (!Array.isArray(serialized)) {
      throw new Error(
        `Expected array for ${key} attribute, got ${typeof serialized}`,
      );
    }

    const itemType = options.itemType;
    let transformedItems = serialized;

    if (itemType && itemType !== 'raw') {
      const itemTransform = this._getItemTransform(itemType, record);
      if (itemTransform) {
        transformedItems = serialized.map((item) => {
          return itemTransform.deserialize(item, {}, record, key);
        });
      }
    }

    return new PrimitiveArray(transformedItems, record, key, itemType);
  }

  serialize(primitiveArray, options = {}) {
    if (!isPresent(primitiveArray)) {
      return [];
    }

    if (typeof primitiveArray.serialize === 'function') {
      return primitiveArray.serialize();
    }

    if (Array.isArray(primitiveArray)) {
      const itemType = options.itemType;

      if (itemType && itemType !== 'raw') {
        const itemTransform = this._getItemTransform(itemType);
        if (itemTransform) {
          return primitiveArray.map((item) => {
            return itemTransform.serialize(item, {});
          });
        }
      }

      return primitiveArray.slice();
    }

    return [];
  }

  _getItemTransform(itemType, record = null) {
    if (record && record.store) {
      try {
        return record.store.serializerFor('-default').transformFor(itemType);
      } catch (e) {
        // Fall through
      }
    }

    switch (itemType) {
      case 'string':
        return {
          deserialize: (value) => (value != null ? String(value) : value),
          serialize: (value) => (value != null ? String(value) : value),
        };
      case 'number':
        return {
          deserialize: (value) => (value != null ? Number(value) : value),
          serialize: (value) => (value != null ? Number(value) : value),
        };
      case 'boolean':
        return {
          deserialize: (value) => (value != null ? Boolean(value) : value),
          serialize: (value) => (value != null ? Boolean(value) : value),
        };
      case 'date':
        return {
          deserialize: (value) => {
            if (value == null) return value;
            return value instanceof Date ? value : new Date(value);
          },
          serialize: (value) => {
            if (value == null) return value;
            return value instanceof Date ? value.toISOString() : value;
          },
        };
      default:
        return null;
    }
  }

  _getDefaultValue(options, record, key) {
    const defaultValue = options.defaultValue;

    if (typeof defaultValue === 'function') {
      const value = defaultValue();
      return new PrimitiveArray(
        Array.isArray(value) ? value : [],
        record,
        key,
        options.itemType,
      );
    }

    if (Array.isArray(defaultValue)) {
      return new PrimitiveArray(
        copy(defaultValue, true),
        record,
        key,
        options.itemType,
      );
    }

    if (defaultValue !== undefined) {
      return new PrimitiveArray([defaultValue], record, key, options.itemType);
    }

    return new PrimitiveArray([], record, key, options.itemType);
  }
}

export { PrimitiveArray };
