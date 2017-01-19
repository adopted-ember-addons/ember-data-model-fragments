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

var keys = Object.keys || Ember.keys;
var create = Object.create || Ember.create;
var getOwner = Ember.getOwner;

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
      first: "Alex",
      last: "Routé"
    });
    ```

    @method createRecord
    @param {String} type
    @param {Object} properties a hash of properties to set on the
      newly created fragment.
    @return {MF.Fragment} fragment
  */
  createFragment: function(modelName, props) {
    Ember.assert("The '" + modelName + "' model must be a subclass of MF.Fragment", this.isFragment(modelName));
    
    var type = this.modelFor(modelName);
    var internalModel = new InternalModel(type, null, this, getOwner(this).container);

    // Re-wire the internal model to use the fragment state machine
    internalModel.currentState = FragmentRootState.empty;

    internalModel._name = null;
    internalModel._owner = null;

    internalModel.loadedData();

    var fragment = internalModel.getRecord();

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
    var type = this.modelFor(modelName);
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

    var person = store.createRecord('person');
    person.changedAttributes(); // {}
    person.get('name').set('first', 'Tomster');
    person.set('type', 'Hamster');
    person.changedAttributes(); // { name: true, type: [undefined, 'Hamster'] }
    ```

    @method changedAttributes
    @return {Object} an object, whose keys are changed properties,
      and value is an [oldProp, newProp] array.
  */
  changedAttributes: function() {
    var diffData = this._super();
    var internalModel = internalModelFor(this);

    keys(internalModel._fragments).forEach(function(name) {
      // An actual diff of the fragment or fragment array is outside the scope
      // of this method, so just indicate that there is a change instead
      if (name in internalModel._attributes) {
        diffData[name] = true;
      }
    }, this);

    return diffData;
  },

  willDestroy: function() {
    this._super.apply(this, arguments);

    var internalModel = internalModelFor(this);
    var key, fragment;

    // destroy the current state
    for (key in internalModel._fragments) {
      if (fragment = internalModel._fragments[key]) {
        fragment.destroy();
      }
    }

    // destroy the original state
    for (key in internalModel._data) {
      if (fragment = internalModel._data[key]) {
        if (fragment instanceof Fragment || fragment instanceof FragmentArray) {
          fragment.destroy();
        }
      }
    }
  }
});

// Replace a method on an object with a new one that calls the original and then
// invokes a function with the result
function decorateMethod(obj, name, fn) {
  var originalFn = obj[name];

  obj[name] = function() {
    var value = originalFn.apply(this, arguments);

    return fn.call(this, value, arguments);
  };
}

var InternalModelPrototype = InternalModel.prototype;

/**
  Override parent method to snapshot fragment attributes before they are
  passed to the `DS.Model#serialize`.

  @method _createSnapshot
  @private
*/
decorateMethod(InternalModelPrototype, 'createSnapshot', function createFragmentSnapshot(snapshot) {
  var attrs = snapshot._attributes;

  keys(attrs).forEach(function(key) {
    var attr = attrs[key];

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
  for (var key in this._fragments) {
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
  var fragment;

  // Notify fragments that the record was committed
  for (var key in this._fragments) {
    if (fragment = this._fragments[key]) {
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
  var attributes = (args[0] && args[0].attributes) || create(null);
  var fragment;

  // Notify fragments that the record was committed
  for (var key in this._fragments) {
    if (fragment = this._fragments[key]) {
      fragment._adapterDidCommit(attributes[key]);
    }
  }
});

decorateMethod(InternalModelPrototype, 'adapterDidError', function adapterDidErrorFragments(returnValue, args) {
  var error = args[0] || create(null);
  var fragment;

  // Notify fragments that the record was committed
  for (var key in this._fragments) {
    if (fragment = this._fragments[key]) {
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
  transformFor: function(attributeType) {
    if (attributeType.indexOf('-mf-') === 0) {
      return getFragmentTransform(getOwner(this), this.store, attributeType);
    }

    return this._super.apply(this, arguments);
  }
});

// Retrieve or create a transform for the specific fragment type
function getFragmentTransform(owner, store, attributeType) {
  var containerKey = 'transform:' + attributeType;
  var match = attributeType.match(/^-mf-(fragment|fragment-array|array)(?:\$([^$]+))?(?:\$(.+))?$/);
  var transformName = match[1];
  var transformType = match[2];
  var polymorphicTypeProp = match[3];

  if (!owner.hasRegistration(containerKey)) {
    var transformClass = owner._lookupFactory('transform:' + transformName);

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
(function patchContainerInstanceCache(instanceCache) {
  var ContainerInstanceCachePrototype = ContainerInstanceCache.prototype;
  var _super = ContainerInstanceCachePrototype._fallbacksFor;
  ContainerInstanceCachePrototype._fallbacksFor = function _modelFragmentsPatchedFallbacksFor(namespace, preferredKey) {
    if (namespace === 'serializer') {
      var model = this._store.modelFactoryFor(preferredKey);
      if (model && Fragment.detect(model)) {
        return [
          '-fragment',
          '-default'
        ];
      }
    }

    return _super.apply(this, [namespace, preferredKey]);
  };
})();

export { Store, Model, JSONSerializer };
