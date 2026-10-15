import { computed, get } from '@ember/object';
import { isDestroying, isDestroyed } from '@ember/destroyable';
import { macroCondition, dependencySatisfies, importSync } from '@embroider/macros';
import './ext.js';
import { copy } from './util/copy.js';
import fragmentCacheFor from './util/fragment-cache.js';
import { recordIdentifierFor } from '@ember-data/store';
import Model from '@ember-data/model';

// The `computed` import is used for the classic `fragmentOwnerProperties`
// static, not inside a native class body.
// eslint-disable-next-line ember/no-computed-properties-in-native-classes
/**
  @module ember-data-model-fragments
*/

/**
 * Helper to get the FragmentRecordDataProxy for a fragment.
 * This provides backwards compatibility with existing code.
 */
function fragmentRecordDataFor(fragment) {
  const identifier = recordIdentifierFor(fragment);
  return fragmentCacheFor(fragment.store).createFragmentRecordData(identifier);
}

/**
  Captures a fragment's values for `Fragment#copy`, in the form
  `createFragment` takes: keyed by attribute name, with nested fragments
  captured as data too, so they are created along with the copy and start
  clean. `serialize()` doesn't fit, because it uses the serializer's keys and
  transformed values.
*/
function fragmentData(fragment) {
  // eachAttribute leaves out fragment attributes, so use the schema service
  const definitions = fragment.store.getSchemaDefinitionService().attributesDefinitionFor(recordIdentifierFor(fragment));
  // A plain object, since a function `typeKey` receives it as `data`
  const data = {};
  for (const name of Object.keys(definitions)) {
    const definition = definitions[name];
    const value = get(fragment, name);
    if (definition?.isFragment || definition?.options?.isFragment) {
      data[name] = fragmentAttributeData(value, definition);
    } else {
      data[name] = copy(value);
    }
  }
  return data;
}
function fragmentAttributeData(value, definition) {
  if (isFragment(value)) {
    return nestedFragmentData(value, definition);
  }

  // A fragment array, or an `@array`
  if (Array.isArray(value) || typeof value?.toArray === 'function') {
    const items = typeof value.toArray === 'function' ? value.toArray() : value;
    return items.map(item => isFragment(item) ? nestedFragmentData(item, definition) : copy(item));
  }
  return copy(value);
}

// A polymorphic fragment of a subtype must carry its type under a string
// `typeKey`, and the fragment class doesn't have to declare that attribute.
function nestedFragmentData(fragment, definition) {
  const data = fragmentData(fragment);
  const {
    polymorphic,
    typeKey
  } = definition.options ?? {};
  const type = recordIdentifierFor(fragment).type;
  if (polymorphic && typeof typeKey !== 'function' && type !== definition.modelName) {
    data[typeKey || 'type'] = type;
  }
  return data;
}

/**
  The public shape of the `Fragment` class. The runtime class is built with
  `Model.extend()` (see below), so the type surface is declared here for
  consumers.
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
  let person = store.peekRecord('person', '1');
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
  ```

  @class Fragment
  @namespace MF
  @extends Model
  @public
*/
// Before ember-source 7.3, `compare` from `@ember/utils` only calls the
// `compare` method of objects that use the `Comparable` mixin. From 7.3 it
// calls any `compare` method and the mixin is deprecated, and from 7.5
// applying the mixin throws. So apply it only where `compare` still needs it.
const comparableMixins = macroCondition(dependencySatisfies('ember-source', '<7.3.0')) ? [importSync('@ember/-internals/runtime').Comparable] : [];
const Fragment = Model.extend(...comparableMixins, {
  compare(f1, f2) {
    return f1 === f2 ? 0 : 1;
  },
  copy() {
    return this.store.createFragment(recordIdentifierFor(this).type, fragmentData(this));
  },
  toStringExtension() {
    if (isDestroying(this) || isDestroyed(this)) {
      return '';
    }
    const identifier = recordIdentifierFor(this);
    const owner = fragmentCacheFor(this.store).getFragmentOwner(identifier);
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
    if (isDestroying(this) || isDestroyed(this)) {
      return `<fragment(destroyed)>`;
    }
    const identifier = recordIdentifierFor(this);
    const extension = this.toStringExtension();
    const extensionStr = extension ? `:${extension}` : '';
    return `<${identifier.type}:${identifier.id}${extensionStr}>`;
  }
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
  configurable: true
});
Object.defineProperty(Fragment, 'toString', {
  value() {
    return `model:${this.modelName || 'fragment'}`;
  },
  configurable: true
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
function getActualFragmentType(declaredType, options, data, owner) {
  if (!options.polymorphic || !data) {
    return declaredType;
  }
  const typeKey = options.typeKey || 'type';
  const actualType = typeof typeKey === 'function' ? typeKey(data, owner) : data[typeKey];
  return actualType || declaredType;
}

// Sets the owner/key values on a fragment
function setFragmentOwner(fragment, ownerRecordDataOrIdentifier, key) {
  const fragmentIdentifier = recordIdentifierFor(fragment);
  const ownerIdentifier = ownerRecordDataOrIdentifier.identifier || ownerRecordDataOrIdentifier;
  fragmentCacheFor(fragment.store).setFragmentOwner(fragmentIdentifier, ownerIdentifier, key);

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
  ownerProps.forEach(name => {
    fragment.notifyPropertyChange(name);
  });
  return fragment;
}

// Determine whether an object is a fragment instance using a stamp to reduce
// the number of instanceof checks
function isFragment(obj) {
  return obj instanceof Fragment;
}

// Override hasDirtyAttributes on Fragment prototype to directly query our cache.
// This ensures we always get fresh dirty state even for fragments in fragment
// arrays where ember-data's tracking might not invalidate properly.
// We use Object.defineProperty to override the inherited getter from Model.
Object.defineProperty(Fragment.prototype, 'hasDirtyAttributes', {
  get() {
    const identifier = recordIdentifierFor(this);
    return fragmentCacheFor(this.store).hasChangedAttrs(identifier);
  },
  configurable: true
});

export { Fragment as default, fragmentRecordDataFor, getActualFragmentType, isFragment, setFragmentOwner };
//# sourceMappingURL=fragment.js.map
