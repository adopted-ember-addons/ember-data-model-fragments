import Store from 'ember-data/system/store';
import Model from 'ember-data/system/model';
import InternalModel from 'ember-data/system/model/internal-model';
import JSONSerializer from 'ember-data/serializers/json-serializer';
import FragmentRootState from './states';
import {
  internalModelFor,
  default as ModelFragment
} from './model';

/**
  @module ember-data.model-fragments
*/

var keys = Object.keys || Ember.keys;

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
    @return {DS.ModelFragment} fragment
  */
  createFragment: function(modelName, props) {
    var type = this.modelFor(modelName);

    Ember.assert("The '" + type + "' model must be a subclass of DS.ModelFragment", ModelFragment.detect(type));

    var internalModel = new InternalModel(type, null, this, this.container);

    // Re-wire the internal model to use the fragment state machine
    internalModel.currentState = FragmentRootState.empty;

    internalModel._name = null;
    internalModel._owner = null;

    internalModel.loadedData();

    var fragment = internalModel.getRecord();

    if (props) {
      fragment.setProperties(props);
    }

    return fragment;
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
      name: DS.hasOneFragment('name')
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
  If the adapter did not return a hash in response to a commit,
  merge the changed attributes and relationships into the existing
  saved data and notify all fragments of the commit.

  @method adapterDidCommit
*/
decorateMethod(InternalModelPrototype, 'adapterDidCommit', function adapterDidCommit(returnValue, args) {
  var attributes = (args[0] && args[0].attributes) || {};
  var fragment;

  // Notify fragments that the record was committed
  for (var key in this._fragments) {
    if (fragment = this._fragments[key]) {
      fragment._adapterDidCommit(attributes[key]);
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
      return getFragmentTransform(this.container, this.store, attributeType);
    }

    return this._super.apply(this, arguments);
  }
});

// Retrieve or create a transform for the specific fragment type
function getFragmentTransform(container, store, attributeType) {
  var registry = container._registry || container;
  var containerKey = 'transform:' + attributeType;
  var match = attributeType.match(/^-mf-(fragment|fragment-array|array)(?:\$([^$]+))?(?:\$(.+))?$/);
  var transformType = match[1];
  var modelName = match[2];
  var polymorphicTypeProp = match[3];

  if (!registry.has(containerKey)) {
    var transformClass = container.lookupFactory('transform:' + transformType);

    registry.register(containerKey, transformClass.extend({
      store: store,
      modelName: modelName,
      polymorphicTypeProp: polymorphicTypeProp
    }));
  }

  return container.lookup(containerKey);
}

export { Store, Model, JSONSerializer };
