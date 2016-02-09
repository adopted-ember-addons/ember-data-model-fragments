var env, store, Person, Name;

QUnit.module("unit - `DS.Store`", {
  setup: function() {
    Person = DS.Model.extend({
      name: MF.fragment('name'),
    });

    Name = MF.Fragment.extend({
      first: DS.attr('string'),
      last: DS.attr('string')
    });

    env = setupEnv({
      person: Person,
      name: Name
    });

    store = env.store;

    expectNoDeprecation();
  },

  teardown: function() {
    store = null;
    Person = null;
    Name = null;
  }
});

test("a fragment can be created that starts in a dirty state", function() {
  Ember.run(function() {
    var address = store.createFragment('name');

    ok(address instanceof Name, "fragment is correct type");
    ok(address.get('hasDirtyAttributes'), "fragment starts in dirty state");
  });
});

test("attempting to create a fragment type that does not inherit from `MF.Fragment` throws an error", function() {
  throws(function() {
    store.createFragment('person');
  }, "an error is thrown when given a bad type");
});

test("the default fragment serializer does not use the application serializer", function() {
  var Serializer = DS.JSONAPISerializer.extend();
  env.registry.register('serializer:application', Serializer);

  ok(!(store.serializerFor('name') instanceof Serializer), "fragment serializer fallback is not `DS.JSONAPISerializer`");
  ok(store.serializerFor('name') instanceof DS.JSONSerializer, "fragment serializer fallback is correct");
});

test("the default fragment serializer does not use the adapter's `defaultSerializer`", function() {
  env.adapter.set('defaultSerializer', '-json-api');

  ok(!(store.serializerFor('name') instanceof DS.JSONAPISerializer), "fragment serializer fallback is not `DS.JSONAPISerializer`");
  ok(store.serializerFor('name') instanceof DS.JSONSerializer, "fragment serializer fallback is correct");
});

test("the default fragment serializer is `serializer:-fragment` if registered", function() {
  var Serializer = DS.JSONSerializer.extend();
  env.registry.register('serializer:-fragment', Serializer);

  ok(store.serializerFor('name') instanceof Serializer, "fragment serializer fallback is correct");
});

test("the application serializer can be looked up", function() {
  ok(store.serializerFor('application') instanceof DS.JSONSerializer, "application serializer can still be looked up");
});

test("the default serializer can be looked up", function() {
  ok(store.serializerFor('-default') instanceof DS.JSONSerializer, "default serializer can still be looked up");
});

test("unloadAll destroys fragments", function() {
  Ember.run(function() {
    var person = store.createRecord('person', {
      name: {
        first: "Catelyn",
        last: "Stark"
      }
    });
    var name = person.get('name');

    store.unloadAll();

    Ember.run.schedule('destroy', function() {
      ok(person.get('isDestroying'), "the model is being destroyed");
      ok(name.get('isDestroying'), "the fragment is being destroyed");
    });
  });
});