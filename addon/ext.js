import { assert } from '@ember/debug';
import Store from 'ember-data/store';
import Model from 'ember-data/model';
import { coerceId, RecordData, InternalModel, normalizeModelName } from 'ember-data/-private';
import { identifierCacheFor } from '@ember-data/store/-private';
import JSONSerializer from 'ember-data/serializers/json';
import FragmentRootState from './states';
import {
  internalModelFor,
  default as Fragment
} from './fragment';
import FragmentArray from './array/fragment';
import { isPresent } from '@ember/utils';
import { computed } from '@ember/object';
import { getOwner } from '@ember/application';
import { assign } from '@ember/polyfills';

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

assign(RecordDataPrototype, {
  eachFragmentKey(fn) {
    this._fragments = this._fragments || Object.create({});
    Object.keys(this._fragments).forEach(fn);
  },

  eachFragmentKeyValue(fn) {
    this.eachFragmentKey((key) => {
      const value = this.getFragment(key);
      if (value) {
        fn(key, value);
      }
    });
  },

  getOwner() {
    return this._owner;
  },

  setOwner(value) {
    this._owner = value;
  },

  setName(value) {
    this._name = value;
  },

  getName() {
    return this._name;
  },

  getFragment(name) {
    this._fragments = this._fragments || Object.create({});
    return this._fragments[name];
  },

  setFragment(name, fragment) {
    this._fragments = this._fragments || Object.create({});
    this._fragments[name] = fragment;
    return this._fragments[name];
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
      this.eachFragmentKeyValue((key, fragment) => fragment._adapterDidCommit(data[key]));
    } else {
      this.eachFragmentKeyValue((key, fragment) => fragment._adapterDidCommit());
    }

    const changedKeys = this._changedKeys(data);

    assign(this._data, this.__inFlightAttributes, this._attributes, data);
    this._attributes = null;
    this._inFlightAttributes = null;
    this._updateChangedAttributes();

    return changedKeys;
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

    let identifierCache = identifierCacheFor(this);
    let recordIdentifier = identifierCache.createIdentifierForNewRecord({ type: modelName });
    let internalModel = new InternalModel(this, recordIdentifier);

    // Re-wire the internal model to use the fragment state machine
    internalModel.currentState = FragmentRootState.empty;

    internalModel._recordData._name = null;
    internalModel._recordData.setOwner(null);

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

function decorateMethodBefore(obj, name, fn) {
  const originalFn = obj[name];
  obj[name] = function() {
    fn.apply(this, arguments);
    return originalFn.apply(this, arguments);
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
  const error = args[0] || Object.create(null);
  this._recordData.eachFragmentKeyValue((key, value) => {
    value._adapterDidError(error);
  });
});

decorateMethod(InternalModelPrototype, 'rollbackAttributes', function rollbackFragments() {
  this._recordData.eachFragmentKeyValue((key, value) => {
    value.rollbackAttributes();
  });
});

decorateMethod(RecordDataPrototype, 'changedAttributes', function changedAttributes(diffData) {
  this.eachFragmentKey((name) => {
    if (name in this._attributes) {
      diffData[name] = [
        diffData[name][0],
        diffData[name][1] ? diffData[name][1]._record : diffData[name][1]
      ];
    }
  });
  return diffData;
});

decorateMethodBefore(RecordDataPrototype, 'willCommit', function willCommit() {
  this.eachFragmentKeyValue((key, fragment) => fragment._flushChangedAttributes());
});

decorateMethodBefore(RecordDataPrototype, 'commitWasRejected', function commitWasRejected() {
  this.eachFragmentKeyValue((key, fragment) => fragment._adapterDidError());
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
    if (attributeType.indexOf('-mf-') !== 0) {
      return this._super(...arguments);
    }

    const owner = getOwner(this);
    const containerKey = `transform:${attributeType}`;

    if (!owner.hasRegistration(containerKey)) {
      const match = attributeType.match(/^-mf-(fragment|fragment-array|array)(?:\$([^$]+))?(?:\$(.+))?$/);
      const transformName = match[1];
      const type = match[2];
      const polymorphicTypeProp = match[3];
      let transformClass = owner.factoryFor(`transform:${transformName}`);
      transformClass = transformClass && transformClass.class;
      transformClass = transformClass.extend({
        type,
        polymorphicTypeProp,
        store: this.store
      });
      owner.register(containerKey, transformClass);
    }
    return owner.lookup(containerKey);
  }
});

export { Store, Model, JSONSerializer };
