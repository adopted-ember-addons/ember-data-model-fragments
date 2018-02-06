import { assert } from '@ember/debug';
import Store from 'ember-data/store';
import Model from 'ember-data/model';
import { InternalModel, normalizeModelName, getOwner } from 'ember-data/-private';
import JSONSerializer from 'ember-data/serializers/json';
import FragmentRootState from './states';
import {
  internalModelFor,
  default as Fragment
} from './fragment';
import FragmentArray from './array/fragment';
import { isPresent } from '@ember/utils';

function serializerForFragment(owner, normalizedModelName) {
  let serializer = owner.lookup(`serializer:${normalizedModelName}`);

  if (serializer !== undefined) {
    return serializer;
  }

  // no serializer found for the specific model, fallback and check for application serializer
  serializer = owner.lookup('serializer:-fragment');
  if (serializer !== undefined) {
    return serializer;
  }

  // final fallback, no model specific serializer, no application serializer, no
  // `serializer` property on store: use json-api serializer
  serializer = owner.lookup('serializer:-default');

  return serializer;
}
/**
  @module ember-data-model-fragments
*/

let InternalModelPrototype = InternalModel.prototype;

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
    assert(`The '${modelName}' model must be a subclass of MF.Fragment`, this.isFragment(modelName));

    let internalModel = new InternalModel(modelName, null, this, getOwner(this).container);

    // Re-wire the internal model to use the fragment state machine
    internalModel.currentState = FragmentRootState.empty;

    internalModel._name = null;
    internalModel._owner = null;

    internalModel.loadedData();

    let fragment = internalModel.getRecord();

    if (props) {
      fragment.setProperties(props);
    }

    // invoke the ready callback ( to mimic DS.Model behaviour )
    fragment.trigger('ready');

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
    if (modelName === 'application' || modelName === '-default') {
      return false;
    }

    let type = this.modelFor(modelName);
    return Fragment.detect(type);
  },

  serializerFor(modelName) {
    // this assertion is cargo-culted from ember-data TODO: update comment
    assert('You need to pass a model name to the store\'s serializerFor method', isPresent(modelName));
    assert(`Passing classes to store.serializerFor has been removed. Please pass a dasherized string instead of ${modelName}`, typeof modelName === 'string');

    let owner = getOwner(this);
    let normalizedModelName = normalizeModelName(modelName);

    if (this.isFragment(normalizedModelName)) {
      return serializerForFragment(owner, normalizedModelName);
    } else  {
      return this._super(...arguments);
    }
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

    Object.keys(internalModel._fragments).forEach(name => {
      // An actual diff of the fragment or fragment array is outside the scope
      // of this method, so just indicate that there is a change instead
      let record = internalModel._fragments[name];
      let dirty;
      if (record instanceof FragmentArray) {
        dirty = record.any(x => x.currentState.isDirty);
      } else if (record instanceof Fragment) {
        dirty = record.currentState.isDirty;
      } else {
        dirty = !!diffData[name];
      }

      if (dirty) {
        diffData[name] = true;
      } else {
        delete diffData[name];
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
        delete internalModel._fragments[key];
      }
    }

    // destroy the original state
    for (key in internalModel._data) {
      fragment = internalModel._data[key];
      if (fragment instanceof Fragment || fragment instanceof FragmentArray) {
        fragment.destroy();
        delete internalModel._data[key];
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

  Object.keys(attrs).forEach(key => {
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
  let attributes = (args[0] && args[0].attributes) || Object.create(null);
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
  let error = args[0] || Object.create(null);
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
    let transformClass = owner.factoryFor(`transform:${transformName}`);
    transformClass = transformClass && transformClass.class;

    owner.register(containerKey, transformClass.extend({
      store: store,
      type: transformType,
      polymorphicTypeProp: polymorphicTypeProp
    }));
  }

  return owner.lookup(containerKey);
}

export { Store, Model, JSONSerializer };
