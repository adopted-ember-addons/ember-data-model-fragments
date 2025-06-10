/**
 * This class exists just to store all the old array prototype extensions.
 */
export default class OldArrayExtended {
  get firstObject() {
    return this.objectAt(0);
  }

  get lastObject() {
    return this.objectAt(-1);
  }

  addObject(item) {
    if (!this.currentState.includes(item)) {
      this.pushObject(item);
    }
    return item;
  }

  includes(item) {
    return this.currentState.includes(item);
  }

  indexOf(item) {
    return this.currentState.indexOf(item);
  }

  isAny(key) {
    return this.currentState.some((item) => item[key]);
  }

  map(callback) {
    return this.currentState.map(callback);
  }

  popObject() {
    if (this.length === 0) return null;
    const item = this.objectAt(this.length - 1);
    this.replace(this.length - 1, 1, []);
    return item;
  }

  pushObject(item) {
    this.replace(this.length, 0, [item]);
    return item;
  }

  removeAt(start, len) {
    return this.currentState.splice(start, len);
  }

  removeObject(item) {
    const index = this.currentState.indexOf(item);
    if (index > -1) {
      this.replace(index, 1, []);
    }
    return item;
  }

  setObjects(items) {
    this.replace(0, this.length, items);
    return this;
  }

  shiftObject() {
    if (this.length === 0) return null;
    const item = this.objectAt(0);
    this.replace(0, 1, []);
    return item;
  }

  unshiftObject(item) {
    this.replace(0, 0, [item]);
    return item;
  }
}
