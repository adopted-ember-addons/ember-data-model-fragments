import Ember from 'ember';
import Store from 'ember-data/store';
import Model from 'ember-data/model';
import InternalModel from 'ember-data/-private/system/model/internal-model';
import ContainerInstanceCache from 'ember-data/-private/system/store/container-instance-cache';
import JSONSerializer from 'ember-data/serializers/json';
import FragmentRootState from './states';
import {
  internalModelFor,
  default as Fragment
} from './fragment';
import FragmentArray from './array/fragment';

/**
  @module ember-data-model-fragments
*/

const keys = Object.keys || Ember.keys;
const create = Object.create || Ember.create;
const getOwner = Ember.getOwner;
const assign = Ember.assign;
const typeOf = Ember.typeOf;

let InternalModelPrototype = InternalModel.prototype;
const internalModelExpectsModelName = InternalModelPrototype.hasOwnProperty('modelClass');

/**
  @class Store
  @namespace DS
*/
Store.reopen({
  /**
    Create a new fragment that does not yet have an owner record.
    The properties passed to this method are set on the newly created
    fragment.

    To create a new instance of the `name` fragment:

    ```js
    store.createFragment('name', {
      first: 'Alex',
      last: 'Routé'
    });
    ```

    @method createRecord
    @param {String} type
    @param {Object} properties a hash of properties to set on the
      newly created fragment.
    @return {MF.Fragment} fragment
  */
  createFragment(modelName, props) {
    Ember.assert(`The '${modelName}' model must be a subclass of MF.Fragment`, this.isFragment(modelName));

    let internalModel;
    if (internalModelExpectsModelName) {
      internalModel = new InternalModel(modelName, null, this, getOwner(this).container);
    } else {
      // BACKWARDS_COMPAT: <= Ember 2.11 the `InternalModel` expected the class,
      // rather than the modelName, as it's first argument.
      let type = this.modelFor(modelName);
      internalModel = new InternalModel(type, null, this, getOwner(this).container);
    }

    // Re-wire the internal model to use the fragment state machine
    internalModel.currentState = FragmentRootState.empty;

    internalModel._name = null;
    internalModel._owner = null;

    internalModel.loadedData();

    let fragment = internalModel.getRecord();

    if (props) {
      fragment.setProperties(props);
    }

    // Add brand to reduce usages of `instanceof`
    fragment._isFragment = true;

    return fragment;
  },

  /**
    Returns true if the modelName is a fragment, false if not

    @method isFragment
    @private
    @param {String} the modelName to check if a fragment
    @return {boolean}
  */
  isFragment(modelName) {
    let type = this.modelFor(modelName);
    return Fragment.detect(type);
  }
});

/**
  @class Model
  @namespace DS
  */
Model.reopen({
  /**
    Returns an object, whose keys are changed properties, and value is
    an [oldProp, newProp] array. When the model has fragments that have
    changed, the property value is simply `true`.

    Example

    ```javascript
    App.Mascot = DS.Model.extend({
      type: DS.attr('string'),
      name: MF.fragment('name')
    });

    App.Name = DS.Model.extend({
      first : DS.attr('string'),
      last  : DS.attr('string')
    });

    let person = store.createRecord('person');
    person.changedAttributes(); // {}
    person.get('name').set('first', 'Tomster');
    person.set('type', 'Hamster');
    person.changedAttributes(); // { name: true, type: [undefined, 'Hamster'] }
    ```

    @method changedAttributes
    @return {Object} an object, whose keys are changed properties,
      and value is an [oldProp, newProp] array.
  */
  changedAttributes() {
    let diffData = this._super(...arguments);
    let internalModel = internalModelFor(this);

    keys(internalModel._fragments).forEach(name => {
      // An actual diff of the fragment or fragment array is outside the scope
      // of this method, so just indicate that there is a change instead
      if (name in internalModel._attributes) {
        diffData[name] = true;
      }
    });

    return diffData;
  },

  willDestroy() {
    this._super(...arguments);

    let internalModel = internalModelFor(this);
    let key, fragment;

    // destroy the current state
    for (key in internalModel._fragments) {
      fragment = internalModel._fragments[key];
      if (fragment) {
        fragment.destroy();
      }
    }

    // destroy the original state
    for (key in internalModel._data) {
      fragment = internalModel._data[key];
      if (fragment instanceof Fragment || fragment instanceof FragmentArray) {
        fragment.destroy();
      }
    }
  }
});

// Replace a method on an object with a new one that calls the original and then
// invokes a function with the result
function decorateMethod(obj, name, fn) {
  let originalFn = obj[name];

  obj[name] = function() {
    let value = originalFn.apply(this, arguments);

    return fn.call(this, value, arguments);
  };
}

/**
  Override parent method to snapshot fragment attributes before they are
  passed to the `DS.Model#serialize`.

  @method _createSnapshot
  @private
*/
decorateMethod(InternalModelPrototype, 'createSnapshot', function createFragmentSnapshot(snapshot) {
  let attrs = snapshot._attributes;

  keys(attrs).forEach(key => {
    let attr = attrs[key];

    // If the attribute has a `_createSnapshot` method, invoke it before the
    // snapshot gets passed to the serializer
    if (attr && typeof attr._createSnapshot === 'function') {
      attrs[key] = attr._createSnapshot();
    }
  });

  return snapshot;
});

/**
  If the model `hasDirtyAttributes` this function will discard any unsaved
  changes, recursively doing the same for all fragment properties.

  Example

  ```javascript
  record.get('name'); // 'Untitled Document'
  record.set('name', 'Doc 1');
  record.get('name'); // 'Doc 1'
  record.rollbackAttributes();
  record.get('name'); // 'Untitled Document'
  ```

  @method rollbackAttributes
*/
decorateMethod(InternalModelPrototype, 'rollbackAttributes', function rollbackFragments() {
  for (let key in this._fragments) {
    if (this._fragments[key]) {
      this._fragments[key].rollbackAttributes();
    }
  }
});

/**
  Before saving a record, its attributes must be moved to in-flight, which must
  happen for all fragments as well

  @method flushChangedAttributes
*/
decorateMethod(InternalModelPrototype, 'flushChangedAttributes', function flushChangedAttributesFragments() {
  let fragment;

  // Notify fragments that the record was committed
  for (let key in this._fragments) {
    fragment = this._fragments[key];
    if (fragment) {
      fragment._flushChangedAttributes();
    }
  }
});

/**
  If the adapter did not return a hash in response to a commit,
  merge the changed attributes and relationships into the existing
  saved data and notify all fragments of the commit.

  @method adapterDidCommit
*/
decorateMethod(InternalModelPrototype, 'adapterDidCommit', function adapterDidCommitFragments(returnValue, args) {
  let attributes = (args[0] && args[0].attributes) || create(null);
  let fragment;

  // Notify fragments that the record was committed
  for (let key in this._fragments) {
    fragment = this._fragments[key];
    if (fragment) {
      fragment._adapterDidCommit(attributes[key]);
    }
  }
});

decorateMethod(InternalModelPrototype, 'adapterDidError', function adapterDidErrorFragments(returnValue, args) {
  let error = args[0] || create(null);
  let fragment;

  // Notify fragments that the record was committed
  for (let key in this._fragments) {
    fragment = this._fragments[key];
    if (fragment) {
      fragment._adapterDidError(error);
    }
  }
});

/**
  Ember Data may return false positives when working with fragments,
  since our changed keys may be Javascript objects, and equality
  between normal Javascript objects cannot be tested with `===`.

  @method _changedKeys
  @private
*/
decorateMethod(InternalModelPrototype, '_changedKeys', function changedKeysFragments(changedKeys, args) {
  let updates = args[0];
  let original = assign({}, this._data);
  original = assign(original, this._inFlightAttributes);

  let i = 0;
  while (i < changedKeys.length) {
    let changedKey = changedKeys[i];
    if (typeOf(original[changedKey]) === 'object' || typeOf(original[changedKey]) === 'array') {
      if (JSON.stringify(original[changedKey]) === JSON.stringify(updates[changedKey])) {
        changedKeys.splice(i, 1);
        continue;
      }
    }
    i += 1;
  }

  return changedKeys;
});

/**
  @class JSONSerializer
  @namespace DS
*/
JSONSerializer.reopen({
  /**
    Enables fragment properties to have custom transforms based on the fragment
    type, so that deserialization does not have to happen on the fly

    @method transformFor
    @private
  */
  transformFor(attributeType) {
    if (attributeType.indexOf('-mf-') === 0) {
      return getFragmentTransform(getOwner(this), this.store, attributeType);
    }

    return this._super(...arguments);
  }
});

// Retrieve or create a transform for the specific fragment type
function getFragmentTransform(owner, store, attributeType) {
  let containerKey = `transform:${attributeType}`;
  let match = attributeType.match(/^-mf-(fragment|fragment-array|array)(?:\$([^$]+))?(?:\$(.+))?$/);
  let transformName = match[1];
  let transformType = match[2];
  let polymorphicTypeProp = match[3];

  if (!owner.hasRegistration(containerKey)) {
    let transformClass;
    if (owner.factoryFor) {
      transformClass = owner.factoryFor(`transform:${transformName}`);
      transformClass = transformClass && transformClass.class;
    } else {
      // BACKWARDS_COMPAT: <= Ember 2.11
      transformClass = owner._lookupFactory(`transform:${transformName}`);
    }

    owner.register(containerKey, transformClass.extend({
      store: store,
      type: transformType,
      polymorphicTypeProp: polymorphicTypeProp
    }));
  }

  return owner.lookup(containerKey);
}

/*
  Patch ember-data's ContainerInstanceCache. Changes fallbacks for fragments
  to use `serializer:-fragment` if registered, then uses the default serializer.
  Previously this was implemented by overriding the `serializerFor` on the store,
  however an ember-data improved their implementation, so we followed suite.
  See: https://github.com/lytics/ember-data-model-fragments/issues/224
*/
(function patchContainerInstanceCache() {
  let ContainerInstanceCachePrototype = ContainerInstanceCache.prototype;
  let _super = ContainerInstanceCachePrototype._fallbacksFor;
  ContainerInstanceCachePrototype._fallbacksFor = function _modelFragmentsPatchedFallbacksFor(namespace, preferredKey) {
    if (namespace === 'serializer') {
      // ember-data-v2.11.2 changed `modelFactoryFor` to return a "factory manager".
      // Test for that accordingly.
      let maybeFactory = this._store.modelFactoryFor(preferredKey);
      if (maybeFactory) {
        // BACKWARDS_COMPAT: <= Ember 2.11.2
        let model = maybeFactory.class ? maybeFactory.class : maybeFactory;
        if (Fragment.detect(model)) {
          return [
            '-fragment',
            '-default'
          ];
        }
      }
    }

    return _super.apply(this, [namespace, preferredKey]);
  };
})();

export { Store, Model, JSONSerializer };
