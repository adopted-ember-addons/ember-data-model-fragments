import { get, computed } from '@ember/object';
import Ember from 'ember';
// DS.Model gets munged to add fragment support, which must be included first
import { Model } from './ext';
import { copy } from './util/copy';
import { recordIdentifierFor } from '@ember-data/store';

/**
  @module ember-data-model-fragments
*/

/**
 * Helper to get the FragmentRecordDataProxy for a fragment.
 * This provides backwards compatibility with existing code.
 */
export function fragmentRecordDataFor(fragment) {
  const identifier = recordIdentifierFor(fragment);
  return fragment.store.cache.createFragmentRecordData(identifier);
}

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
  import Model from '@ember-data/model';
  import MF from 'ember-data-model-fragments';
  
  class Person extends Model {
    @MF.fragment('name') name;
  }

  class Name extends MF.Fragment {
    @attr('string') first;
    @attr('string') last;
  }
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
  let name = person.name;

  person.hasDirtyAttributes; // false
  name.hasDirtyAttributes; // false
  name.first; // 'Robert'

  name.first = 'The Animal';
  name.hasDirtyAttributes; // true
  person.hasDirtyAttributes; // true

  person.rollbackAttributes();
  name.first; // 'Robert'
  person.hasDirtyAttributes; // false
  person.hasDirtyAttributes; // false
  ```

  @class Fragment
  @namespace MF
  @extends Model
  @uses Ember.Comparable
  @public
*/
// Note: We use Model.extend() with Ember.Comparable mixin for now
// as mixins are being phased out but still work in ember-data 4.12+
const Fragment = Model.extend(Ember.Comparable, {
  /**
    Compare two fragments by identity to allow `FragmentArray` to diff arrays.

    @method compare
    @param {Fragment} f1 - The first fragment to compare
    @param {Fragment} f2 - The second fragment to compare
    @return {Integer} The result of the comparison (0 if equal, 1 if not)
    @public
  */
  compare(f1, f2) {
    return f1 === f2 ? 0 : 1;
  },

  /**
    Create a new fragment that is a copy of the current fragment. Copied
    fragments do not have the same owner record set, so they may be added
    to other records safely.

    @method copy
    @return {Fragment} The newly created fragment
    @public
  */
  copy() {
    const type = this.constructor;
    const props = Object.create(null);
    const modelName = type.modelName || this._internalModel.modelName;
    const identifier = recordIdentifierFor(this);

    // Use schema service to get all attributes including fragment attributes
    // eachAttribute only iterates standard @attr() properties, not fragment properties
    const schemaService = this.store
      .getSchemaDefinitionService()
      .attributesDefinitionFor(identifier);

    // Loop over each attribute and copy individually to ensure nested fragments
    // are also copied. For fragment attributes, we need to serialize to raw data
    // since createFragment expects raw data, not fragment instances.
    for (const name of Object.keys(schemaService)) {
      const value = get(this, name);
      const definition = schemaService[name];
      const isFragmentAttr =
        definition?.isFragment || definition?.options?.isFragment;

      if (isFragmentAttr) {
        // For fragment attributes, serialize to get raw data that can be used to create new fragments
        if (value === null || value === undefined) {
          props[name] = value;
        } else if (typeof value.serialize === 'function') {
          // Single fragment - serialize it
          props[name] = value.serialize();
        } else if (
          Array.isArray(value) ||
          typeof value.toArray === 'function'
        ) {
          // Fragment array or array - serialize each element
          const arr =
            typeof value.toArray === 'function' ? value.toArray() : value;
          props[name] = arr.map((item) =>
            typeof item.serialize === 'function' ? item.serialize() : item,
          );
        } else {
          // Fallback - use as-is
          props[name] = value;
        }
      } else {
        // Regular attribute - just copy the value
        props[name] = copy(value);
      }
    }

    return this.store.createFragment(modelName, props);
  },

  /**
    @method toStringExtension
    @return {String}
    @public
  */
  toStringExtension() {
    const identifier = recordIdentifierFor(this);
    const owner = this.store.cache.getFragmentOwner(identifier);
    return owner ? `owner(${owner.ownerIdentifier?.id})` : '';
  },

  /**
    Override toString to include the toStringExtension output.
    ember-data 4.12+ doesn't call toStringExtension in Model.toString().
    
    @method toString
    @return {String}
    @public
  */
  toString() {
    const identifier = recordIdentifierFor(this);
    const extension = this.toStringExtension();
    const extensionStr = extension ? `:${extension}` : '';
    return `<${identifier.type}:${identifier.id}${extensionStr}>`;
  },
});

// Add static property using native class syntax approach
// This replaces reopenClass which is deprecated
Object.defineProperty(Fragment, 'fragmentOwnerProperties', {
  get() {
    return computed(function () {
      const props = [];

      this.eachComputedProperty((name, meta) => {
        if (meta.isFragmentOwner) {
          props.push(name);
        }
      });

      return props;
    }).readOnly();
  },
  configurable: true,
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
export function setFragmentOwner(fragment, ownerRecordDataOrIdentifier, key) {
  const fragmentIdentifier = recordIdentifierFor(fragment);
  const ownerIdentifier =
    ownerRecordDataOrIdentifier.identifier || ownerRecordDataOrIdentifier;
  fragment.store.cache.setFragmentOwner(
    fragmentIdentifier,
    ownerIdentifier,
    key,
  );

  // Notify any observers of `fragmentOwner` properties
  // Look up model via store to avoid schema access deprecation in ember-data 4.12+
  const modelClass = fragment.store.modelFor(fragment.constructor.modelName);

  // Get the fragment owner properties array
  // In 4.13+, we need to iterate computed properties directly since static property access may not work
  const ownerProps = [];
  modelClass.eachComputedProperty((name, meta) => {
    if (meta.isFragmentOwner) {
      ownerProps.push(name);
    }
  });

  ownerProps.forEach((name) => {
    fragment.notifyPropertyChange(name);
  });

  return fragment;
}

// Determine whether an object is a fragment instance using a stamp to reduce
// the number of instanceof checks
export function isFragment(obj) {
  return obj instanceof Fragment;
}

// Override hasDirtyAttributes on Fragment prototype to directly query our cache.
// This ensures we always get fresh dirty state even for fragments in fragment
// arrays where ember-data's tracking might not invalidate properly.
// We use Object.defineProperty to override the inherited getter from Model.
Object.defineProperty(Fragment.prototype, 'hasDirtyAttributes', {
  get() {
    const identifier = recordIdentifierFor(this);
    return this.store.cache.hasChangedAttrs(identifier);
  },
  configurable: true,
});

export default Fragment;
