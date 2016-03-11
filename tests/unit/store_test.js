import Ember from 'ember';
import { test } from 'qunit';
import moduleForAcceptance from '../helpers/module-for-acceptance';
import Name from 'dummy/models/name';
import JSONAPISerializer from 'ember-data/serializers/json-api';
import JSONSerializer from 'ember-data/serializers/json';
var store, application;

moduleForAcceptance("unit - `DS.Store`", {
  beforeEach: function() {
    application = this.application;
    store = application.__container__.lookup('service:store');

    //expectNoDeprecation();
  },

  afterEach: function() {
    store = null;
    application = null;
  }
});

test("a fragment can be created that starts in a dirty state", function(assert) {
  Ember.run(() => {
    var address = store.createFragment('name');

    assert.ok(address instanceof Name, "fragment is correct type");
    assert.ok(address.get('hasDirtyAttributes'), "fragment starts in dirty state");
  });
});

test("attempting to create a fragment type that does not inherit from `MF.Fragment` throws an error", function(assert) {
  Ember.run(() => {
    assert.throws(function() {
      store.createFragment('person');
    }, "an error is thrown when given a bad type");
  });
});

test("the default fragment serializer does not use the application serializer", function(assert) {
  var Serializer = JSONAPISerializer.extend();
  application.register('serializer:application', Serializer);

  assert.ok(!(store.serializerFor('name') instanceof Serializer), "fragment serializer fallback is not `JSONAPISerializer`");
  assert.ok(store.serializerFor('name') instanceof JSONSerializer, "fragment serializer fallback is correct");
});

test("the default fragment serializer does not use the adapter's `defaultSerializer`", function(assert) {
  store.set('defaultAdapter.defaultSerializer', '-json-api');

  assert.ok(!(store.serializerFor('name') instanceof JSONAPISerializer), "fragment serializer fallback is not `JSONAPISerializer`");
  assert.ok(store.serializerFor('name') instanceof JSONSerializer, "fragment serializer fallback is correct");
});

test("the default fragment serializer is `serializer:-fragment` if registered", function(assert) {
  var Serializer = JSONSerializer.extend();
  application.register('serializer:-fragment', Serializer);

  assert.ok(store.serializerFor('name') instanceof Serializer, "fragment serializer fallback is correct");
});

test("the application serializer can be looked up", function(assert) {
  assert.ok(store.serializerFor('application') instanceof JSONSerializer, "application serializer can still be looked up");
});

test("the default serializer can be looked up", function(assert) {
  assert.ok(store.serializerFor('-default') instanceof JSONSerializer, "default serializer can still be looked up");
});

test("unloadAll destroys fragments", function(assert) {
  Ember.run(() => {
    var person = store.createRecord('person', {
      name: {
        first: "Catelyn",
        last: "Stark"
      }
    });
    var name = person.get('name');

    store.unloadAll();

    Ember.run.schedule('destroy', function() {
      assert.ok(person.get('isDestroying'), "the model is being destroyed");
      assert.ok(name.get('isDestroying'), "the fragment is being destroyed");
    });
  });
});
