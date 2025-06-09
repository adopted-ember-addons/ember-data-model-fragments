import { assert } from '@ember/debug';
import Store from '@ember-data/store';
import Model from '@ember-data/model';
// eslint-disable-next-line ember/use-ember-data-rfc-395-imports
import { Snapshot, normalizeModelName } from 'ember-data/-private';
import JSONSerializer from '@ember-data/serializer/json';
import FragmentRecordData from './record-data';
import { default as Fragment } from './fragment';
import { isPresent } from '@ember/utils';
import { getOwner } from '@ember/application';
import { gte } from 'ember-compatibility-helpers';

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

/**
  @class Store
  @namespace DS
*/
Store.reopen({
  createRecordDataFor(type, id, lid, storeWrapper) {
    if (!gte('ember-data', '3.28.0')) {
      throw new Error(
        'This version of Ember Data Model Fragments is incompatible with Ember Data Versions below 3.28. See matrix at https://github.com/adopted-ember-addons/ember-data-model-fragments#compatibility for details.',
      );
    }
    const identifier = this.identifierCache.getOrCreateRecordIdentifier({
      type,
      id,
      lid,
    });
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
    assert(
      `The '${modelName}' model must be a subclass of MF.Fragment`,
      this.isFragment(modelName),
    );
    let recordData;
    if (gte('ember-data', '4.5.0')) {
      recordData = this._instanceCache.recordDataFor({ type: modelName }, true);
    } else {
      recordData = this.recordDataFor({ type: modelName }, true);
    }
    return recordData._fragmentGetRecord(props);
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

    const type = this.modelFor(modelName);
    return Fragment.detect(type);
  },

  serializerFor(modelName) {
    // this assertion is cargo-culted from ember-data TODO: update comment
    assert(
      "You need to pass a model name to the store's serializerFor method",
      isPresent(modelName),
    );
    assert(
      `Passing classes to store.serializerFor has been removed. Please pass a dasherized string instead of ${modelName}`,
      typeof modelName === 'string',
    );

    const owner = getOwner(this);
    const normalizedModelName = normalizeModelName(modelName);

    if (this.isFragment(normalizedModelName)) {
      return serializerForFragment(owner, normalizedModelName);
    } else {
      return this._super(...arguments);
    }
  },
});

/**
  Override `Snapshot._attributes` to snapshot fragment attributes before they are
  passed to the `DS.Model#serialize`.

  @private
*/
const oldSnapshotAttributes = Object.getOwnPropertyDescriptor(
  Snapshot.prototype,
  '_attributes',
);

Object.defineProperty(Snapshot.prototype, '_attributes', {
  get() {
    const attrs = oldSnapshotAttributes.get.call(this);
    Object.keys(attrs).forEach((key) => {
      const attr = attrs[key];
      // If the attribute has a `_createSnapshot` method, invoke it before the
      // snapshot gets passed to the serializer
      if (attr && typeof attr._createSnapshot === 'function') {
        attrs[key] = attr._createSnapshot();
      }
    });
    return attrs;
  },
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
      const match = attributeType.match(
        /^-mf-(fragment|fragment-array|array)(?:\$([^$]+))?(?:\$(.+))?$/,
      );
      assert(
        `Failed parsing ember-data-model-fragments attribute type ${attributeType}`,
        match != null,
      );
      const transformName = match[1];
      const type = match[2];
      const polymorphicTypeProp = match[3];
      let transformClass = owner.factoryFor(`transform:${transformName}`);
      transformClass = transformClass && transformClass.class;
      transformClass = transformClass.extend({
        type,
        polymorphicTypeProp,
        store: this.store,
      });
      owner.register(containerKey, transformClass);
    }
    return owner.lookup(containerKey);
  },

  // We need to override this to handle polymorphic with a typeKey function
  applyTransforms(typeClass, data) {
    const attributes = typeClass.attributes;

    typeClass.eachTransformedAttribute((key, typeClass) => {
      if (data[key] === undefined) {
        return;
      }

      const transform = this.transformFor(typeClass);
      const transformMeta = attributes.get(key);
      data[key] = transform.deserialize(data[key], transformMeta.options, data);
    });

    return data;
  },
});

export { Store, Model, JSONSerializer };
