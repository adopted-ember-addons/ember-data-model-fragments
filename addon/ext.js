import { assert } from '@ember/debug';
import Store from 'ember-data/store';
import Model from 'ember-data/model';
import { coerceId, RecordData, InternalModel, normalizeModelName, getOwner } from 'ember-data/-private';
import JSONSerializer from 'ember-data/serializers/json';
import FragmentRootState from './states';
import {
  internalModelFor,
  default as Fragment
} from './fragment';
import FragmentArray from './array/fragment';
import { isPresent } from '@ember/utils';
import { computed } from '@ember/object';

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

const InternalModelPrototype = InternalModel.prototype;
const RecordDataPrototype = RecordData.prototype;

Object.assign(RecordDataPrototype, {
  getFragment(name) {
    this._fragments = this._fragments || Object.create({});
    return this._fragments[name];
  },

  setFragment(name, fragment) {
    this._fragments = this._fragments || Object.create({});
    this._fragments[name] = fragment;
    return this._fragments[name];
  },

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
  rollbackAttributes() {
    let dirtyKeys;

    for (let key in this._fragments) {
      if (this._fragments[key]) {
        this._fragments[key].rollbackAttributes();
      }
    }

    if (this.hasChangedAttributes()) {
      dirtyKeys = Object.keys(this._attributes);
      this._attributes = null;
    }

    if (this.isNew()) {
      this.removeFromInverseRelationships(true);
    }

    this._inFlightAttributes = null;

    return dirtyKeys;
  },

  didCommit(data) {
    this._isNew = false;
    if (data) {
      if (data.relationships) {
        this._setupRelationships(data);
      }
      if (data.id) {
        // didCommit provided an ID, notify the store of it
        this.storeWrapper.setRecordId(this.modelName, data.id, this.clientId);
        this.id = coerceId(data.id);
      }
      data = data.attributes;

      // Notify fragments that the record was committed
      const fragments = this._fragments;
      for (let key in fragments) {
        if (fragments[key]) {
          fragments[key]._adapterDidCommit(data[key]);
        }
      }
    }
    let changedKeys = this._changedKeys(data);

    Object.assign(this._data, this.__inFlightAttributes, data);

    this._inFlightAttributes = null;

    this._updateChangedAttributes();
    return changedKeys;
  },
  willCommit() {
    // Notify fragments that the record was committed
    const fragments = this._fragments;
    for (let key in fragments) {
      if (fragments[key]) {
        fragments[key]._flushChangedAttributes();
      }
    }
    this._inFlightAttributes = this._attributes;
    this._attributes = null;
  }
});

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

    internalModel._recordData._name = null;
    internalModel._recordData._owner = null;

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
  willDestroy() {
    this._super(...arguments);

    let internalModel = internalModelFor(this);
    let key, fragment;

    // destroy the current state
    for (key in internalModel._recordData._fragments) {
      fragment = internalModel._recordData._fragments[key];
      if (fragment) {
        fragment.destroy();
        delete internalModel._recordData._fragments[key];
      }
    }

    // destroy the original state
    for (key in internalModel._recordData._data) {
      fragment = internalModel._recordData._data[key];
      if (fragment instanceof Fragment || fragment instanceof FragmentArray) {
        fragment.destroy();
        delete internalModel._recordData._data[key];
      }
    }
  }
});

Model.reopenClass({
  fields: computed(function() {
    let map = new Map();

    this.eachComputedProperty((name, meta) => {
      if (meta.isFragment) {
        map.set(name, 'fragment');
      } else if (meta.isRelationship) {
        map.set(name, meta.kind);
      } else if (meta.isAttribute) {
        map.set(name, 'attribute');
      }
    });

    return map;
  }).readOnly()

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
  Object.keys(attrs).forEach((key) => {
    let attr = attrs[key];
    // If the attribute has a `_createSnapshot` method, invoke it before the
    // snapshot gets passed to the serializer
    if (attr && typeof attr._createSnapshot === 'function') {
      attrs[key] = attr._createSnapshot();
    }
  });

  return snapshot;
});

decorateMethod(InternalModelPrototype, 'adapterDidError', function adapterDidErrorFragments(returnValue, args) {
  const fragments = this._recordData._fragments;
  let error = args[0] || Object.create(null);
  // Notify fragments that the record was committed
  for (let key in fragments) {
    if (fragments[key]) {
      fragments[key]._adapterDidError(error);
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
