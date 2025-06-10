import { assert } from '@ember/debug';
import { typeOf } from '@ember/utils';
import StatefulArray from './stateful';
import { isFragment, setFragmentOwner } from '../fragment';
import isInstanceOfType from '../util/instance-of-type';
import { recordDataFor } from '@ember-data/store/-private';

/**
  A state-aware array of fragments that is tied to an attribute of a `DS.Model`
  instance. `FragmentArray` instances should not be created directly, instead
  use `MF.fragmentArray` or `MF.array`.

  @class FragmentArray
  @namespace MF
  @extends StatefulArray
*/
export default class FragmentArray extends StatefulArray {
  /**
    The type of fragments the array contains

    @property modelName
    @private
    @type {String}
  */
  modelName = null;
  store = null;

  constructor({ modelName, store, recordData, key }) {
    super(recordData, key);
    this.modelName = modelName;
    this.store = store;
  }

  /**
    Normalizes a new value being inserted into the array.
    Ensures the value is either a fragment instance or a plain object
    that can be hydrated into one.

    @method _normalizeData
    @private
    @param {*} data
    @param {Number} index
    @return {MF.Fragment}
  */
  _normalizeData(data, index) {
    assert(
      `You can only add '${this.modelName}' fragments or object literals to this property`,
      typeOf(data) === 'object' ||
        isInstanceOfType(this.store.modelFor(this.modelName), data),
    );

    if (isFragment(data)) {
      const recordData = recordDataFor(data);
      setFragmentOwner(data, this.recordData, this.key);
      return recordData._fragmentGetRecord();
    }

    const existing = this.currentState[index];
    if (existing) {
      existing.setProperties(data);
      return existing;
    }

    const recordData = this.recordData._newFragmentRecordDataForKey(
      this.key,
      data,
    );
    return recordData._fragmentGetRecord();
  }

  /**
    Retrieves the underlying fragment instances from the recordDatas.

    @method _getFragmentState
    @private
    @return {Array<MF.Fragment>}
  */
  _getFragmentState() {
    const recordDatas = super._getFragmentState();
    return recordDatas?.map((recordData) => recordData._fragmentGetRecord());
  }

  /**
    Stores the internal recordDatas for each fragment in the array.

    @method _setFragmentState
    @private
    @param {Array<MF.Fragment>} fragments
  */
  _setFragmentState(fragments) {
    const recordDatas = fragments.map((fragment) => recordDataFor(fragment));
    super._setFragmentState(recordDatas);
  }

  /**
    Create a snapshot of each fragment in the array.

    @method _createSnapshot
    @private
    @return {Array<Object>}
  */
  _createSnapshot() {
    return this.currentState.map((fragment) => fragment._createSnapshot());
  }

  /**
    Serializing a fragment array returns a new array containing the results of
    calling `serialize` on each fragment in the array.

    @method serialize
    @return {Array}
  */
  serialize() {
    return this.currentState.map((fragment) => fragment.serialize());
  }

  /**
    Adds an existing fragment to the end of the fragment array. Alias for
    `addObject`.

    @method addFragment
    @param {MF.Fragment} fragment
    @return {MF.Fragment} the newly added fragment
  */
  addFragment(fragment) {
    return this.addObject(fragment);
  }

  /**
    Removes the given fragment from the array. Alias for `removeObject`.

    @method removeFragment
    @param {MF.Fragment} fragment
    @return {MF.Fragment} the removed fragment
  */
  removeFragment(fragment) {
    return this.removeObject(fragment);
  }

  /**
    Creates a new fragment of the fragment array's type and adds it to the end
    of the fragment array.

    @method createFragment
    @param {Object} props
    @return {MF.Fragment} the newly added fragment
  */
  createFragment(props) {
    const recordData = this.recordData._newFragmentRecordDataForKey(
      this.key,
      props,
    );
    const fragment = recordData._fragmentGetRecord(props);
    return this.pushObject(fragment);
  }
}
