import { tracked } from '@glimmer/tracking';
import { assert } from '@ember/debug';
import { isArray } from '@ember/array';
import { gte } from 'ember-compatibility-helpers';
import { diffArray } from '@ember-data/model/-private';
import { TrackedArray } from 'tracked-built-ins';
import { copy } from '../util/copy';
import OldArrayExtended from './old-array-extended';

const HAS_ARRAY_OBSERVERS = !gte('4.0.0');

export default class StatefulArray extends OldArrayExtended {
  @tracked _version = 0;

  _length = 0;
  _isUpdating = false;
  _isDirty = false;
  _hasNotified = false;

  constructor(recordData, key) {
    super();

    this.currentState = new TrackedArray([]);
    this.recordData = recordData;
    this.key = key;
    this.retrieveLatest();
  }

  teardown() {
    this.recordData = null;
    this.currentState = null;
    this._length = 0;
    this._isDirty = false;
    this._hasNotified = false;
    this._isUpdating = false;
  }

  get owner() {
    return this.recordData._fragmentGetRecord();
  }

  get length() {
    if (this._isDirty) {
      this.retrieveLatest();
    }
    this._version;
    return this._length;
  }

  get hasDirtyAttributes() {
    return this.recordData.isFragmentDirty(this.key);
  }

  toArray() {
    this._version;
    return [...this.currentState];
  }

  objectAt(index) {
    if (this._isDirty) {
      this.retrieveLatest();
    }
    return this.currentState?.at(index);
  }

  notify() {
    this._isDirty = true;
    if (HAS_ARRAY_OBSERVERS && !this._hasNotified) {
      this.retrieveLatest();
    } else {
      this._hasNotified = true;
      this._version++;
    }
  }

  replace(start, deleteCount, items) {
    assert('replace items must be an array', isArray(items));
    assert('Cannot update destroyed fragment', !this.isDestroyed());

    if (deleteCount === 0 && items.length === 0) {
      return;
    }

    if (this._isDirty) {
      this.retrieveLatest();
    }

    const updated = [...this.currentState];
    const normalized = items.map((item, i) =>
      this._normalizeData(item, start + i),
    );
    updated.splice(start, deleteCount, ...normalized);

    this.currentState = new TrackedArray(updated);
    this._length = this.currentState.length;

    this._setFragmentState([...this.currentState]);
    this.notify();
  }

  _setFragments(items) {
    if (this._isDirty) {
      this.retrieveLatest();
    }
    this.replace(0, this._length, items);
  }

  rollbackAttributes() {
    this.recordData.rollbackFragment(this.key);
  }

  serialize() {
    return this.toArray();
  }

  copy() {
    return this.currentState.map(copy);
  }

  _createSnapshot() {
    return this.toArray();
  }

  toStringExtension() {
    return `owner(${this.owner?.id})`;
  }

  retrieveLatest() {
    if (this.isDestroyed() || this._isUpdating) {
      return;
    }

    const state = this._getFragmentState();
    if (state == null) {
      return;
    }

    this._isDirty = false;
    this._isUpdating = true;

    if (HAS_ARRAY_OBSERVERS && !this._hasNotified) {
      const diff = diffArray(this.currentState, state);
      if (diff.firstChangeIndex !== null) {
        this._length = state.length;
        this.currentState = new TrackedArray(state);
      }
    } else {
      this._hasNotified = false;
      this._length = state.length;
      this.currentState = new TrackedArray(state);
    }

    this._version++;
    this._isUpdating = false;
  }

  _getFragmentState() {
    return this.recordData.getFragment(this.key);
  }

  _setFragmentState(array) {
    this.recordData.setDirtyFragment(this.key, array);
  }

  _normalizeData(data /*, index */) {
    return data;
  }

  isDestroyed() {
    return this.recordData.isDestroyed || this.recordData.isDestroying;
  }
}
