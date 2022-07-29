import { assert } from '@ember/debug';
import Store from '@ember-data/store';
import Model from '@ember-data/model';
// eslint-disable-next-line ember/use-ember-data-rfc-395-imports
import { InternalModel, normalizeModelName } from 'ember-data/-private';
import JSONSerializer from '@ember-data/serializer/json';
import FragmentRecordData from './record-data';
import { default as Fragment } from './fragment';
import { isPresent } from '@ember/utils';
import { getOwner } from '@ember/application';
import { lte, gte } from 'ember-compatibility-helpers';
import { get } from '@ember/object';

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
/**
  @class Store
  @namespace DS
*/
Store.reopen({
  createRecordDataFor(type, id, lid, storeWrapper) {
    let identifier;
    if (lte('ember-data', '3.13.0')) {
      throw new Error('This version of Ember Data Model Fragments is incompatible with Ember Data Versions below 3.13. See matrix at https://github.com/lytics/ember-data-model-fragments#compatibility for details.');
    }
    if (gte('ember-data', '3.15.0')) {
      identifier = this.identifierCache.getOrCreateRecordIdentifier({ type, id, lid });
    } else {
      identifier = { type, id, clientId: lid };
    }
    return new FragmentRecordData(identifier, storeWrapper);
  },

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
    let internalModel;
    if (gte('ember-data', '3.15.0')) {
      const identifier = this.identifierCache.createIdentifierForNewRecord({ type: modelName });
      internalModel = this._internalModelForResource(identifier);
    } else {
      let identifier = { type: modelName, id: `${Math.random()}`, lid: `${Math.random()}` };
      internalModel = this._internalModelForResource(identifier);
    }
    internalModel.send('loadedData');
    internalModel.didCreateRecord();
    return internalModel.getRecord(props);
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
    } else {
      return this._super(...arguments);
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
  },

  // We need to override this to handle polymorphic with a typeKey function
  applyTransforms(typeClass, data) {
    let attributes = get(typeClass, 'attributes');

    typeClass.eachTransformedAttribute((key, typeClass) => {
      if (data[key] === undefined) {
        return;
      }

      let transform = this.transformFor(typeClass);
      let transformMeta = attributes.get(key);
      data[key] = transform.deserialize(data[key], transformMeta.options, data);
    });

    return data;
  }
});

export { Store, Model, JSONSerializer };
