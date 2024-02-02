import { copy, Copyable } from 'ember-copy';
import { get, computed } from '@ember/object';
import Ember from 'ember';
// DS.Model gets munged to add fragment support, which must be included first
import { Model } from './ext';
import { recordDataFor } from '@ember-data/store/-private';

/**
  @module ember-data-model-fragments
*/

/**
  The class that all nested object structures, or 'fragments', descend from.
  Fragments are bound to a single 'owner' record (an instance of `DS.Model`)
  and cannot change owners once set. They behave like models, but they have
  no `save` method since their persistence is managed entirely through their
  owner. Because of this, a fragment's state directly influences its owner's
  state, e.g. when a record's fragment `hasDirtyAttributes`, its owner
  `hasDirtyAttributes`.

  Example:

  ```javascript
  App.Person = DS.Model.extend({
    name: MF.fragment('name')
  });

  App.Name = MF.Fragment.extend({
    first  : DS.attr('string'),
    last   : DS.attr('string')
  });
  ```

  With JSON response:

  ```json
  {
    'id': '1',
    'name': {
      'first': 'Robert',
      'last': 'Jackson'
    }
  }
  ```

  ```javascript
  let person = store.getbyid('person', '1');
  let name = person.get('name');

  person.get('hasDirtyAttributes'); // false
  name.get('hasDirtyAttributes'); // false
  name.get('first'); // 'Robert'

  name.set('first', 'The Animal');
  name.get('hasDirtyAttributes'); // true
  person.get('hasDirtyAttributes'); // true

  person.rollbackAttributes();
  name.get('first'); // 'Robert'
  person.get('hasDirtyAttributes'); // false
  person.get('hasDirtyAttributes'); // false
  ```

  @class Fragment
  @namespace MF
  @extends CoreModel
  @uses Ember.Comparable
  @uses Copyable
*/
const Fragment = Model.extend(Ember.Comparable, Copyable, {
  /**
    Compare two fragments by identity to allow `FragmentArray` to diff arrays.

    @method compare
    @param a {MF.Fragment} the first fragment to compare
    @param b {MF.Fragment} the second fragment to compare
    @return {Integer} the result of the comparison
  */
  compare(f1, f2) {
    return f1 === f2 ? 0 : 1;
  },

  /**
    Create a new fragment that is a copy of the current fragment. Copied
    fragments do not have the same owner record set, so they may be added
    to other records safely.

    @method copy
    @return {MF.Fragment} the newly created fragment
  */
  copy() {
    const type = this.constructor;
    const props = Object.create(null);

    // Loop over each attribute and copy individually to ensure nested fragments
    // are also copied
    type.eachAttribute((name) => {
      props[name] = copy(get(this, name));
    });

    const modelName = type.modelName || this._internalModel.modelName;
    return this.store.createFragment(modelName, props);
  },

  toStringExtension() {
    const owner = recordDataFor(this).getFragmentOwner();
    return owner ? `owner(${owner.id})` : '';
  },
}).reopenClass({
  fragmentOwnerProperties: computed(function () {
    const props = [];

    this.eachComputedProperty((name, meta) => {
      if (meta.isFragmentOwner) {
        props.push(name);
      }
    });

    return props;
  }).readOnly(),
});

/**
 * `getActualFragmentType` returns the actual type of a fragment based on its declared type
 * and whether it is configured to be polymorphic.
 *
 * @private
 * @param {String} declaredType the type as declared by `MF.fragment` or `MF.fragmentArray`
 * @param {Object} options the fragment options
 * @param {Object} data the fragment data
 * @return {String} the actual fragment type
 */
export function getActualFragmentType(declaredType, options, data, owner) {
  if (!options.polymorphic || !data) {
    return declaredType;
  }

  const typeKey = options.typeKey || 'type';
  const actualType =
    typeof typeKey === 'function' ? typeKey(data, owner) : data[typeKey];

  return actualType || declaredType;
}

// Sets the owner/key values on a fragment
export function setFragmentOwner(fragment, record, key) {
  const recordData = recordDataFor(fragment);
  recordData.setFragmentOwner(record, key);

  // Notify any observers of `fragmentOwner` properties
  fragment.constructor.fragmentOwnerProperties.forEach((name) => {
    fragment.notifyPropertyChange(name);
  });

  return fragment;
}

// Determine whether an object is a fragment instance using a stamp to reduce
// the number of instanceof checks
export function isFragment(obj) {
  return obj instanceof Fragment;
}

export default Fragment;
