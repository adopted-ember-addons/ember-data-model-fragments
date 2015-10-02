var env, store, Person;

QUnit.module("unit/fragments - Default Values", {
  setup: function() {
    Person = DS.ModelFragment.extend({
      firstName : DS.attr("string", { defaultValue: 'Bob' }),
      lastName  : DS.attr("string"),
      title     : DS.attr("string", { defaultValue: null }),
      company   : DS.attr("string", { defaultValue: undefined }),
      employed  : DS.attr("boolean", { defaultValue: false })
    });

    env = setupEnv({
      person: Person,
    });

    store = env.store;
  },

  teardown: function() {
    env = null;
    store = null;
    Person = null;
  }
});

test("default values are used when no values are specified in the payload", function() {
  store.push({
    type: 'person',
    id: 1,
    attributes: {}
  });

  return store.find('person', 1).then(function(person) {
    equal(person.get('firstName'), 'Bob', "truthy default value is used");
    equal(person.get('lastName'), undefined, "no default value returns undefined");
    equal(person.get('title'), null, "a default value of null returns null");
    equal(person.get('company'), undefined, "a default value of undefined returns undefined");
    equal(person.get('employed'), false, "a default value of false returns false");
  });
});

test("values in the payload override default values", function() {
  store.push({
    type: 'person',
    id: 1,
    attributes: {
      firstName: undefined,
      lastName:  'Smith',
      company: null
    }
  });

  return store.find('person', 1).then(function(person) {
    equal(person.get('firstName'), undefined, "setting to undefined overrides the default value");
    equal(person.get('lastName'), 'Smith', "setting to a truthy value overrides the default value");
    equal(person.get('company'), null, "setting to null overrides the default value");
  });
});

test("default values are overridden when the property is set", function() {
  store.push({
    type: 'person',
    id: 1,
    attributes: {}
  });

  return store.find('person', 1).then(function(person) {
    person.set('firstName', 'Ted');
    equal(person.get('firstName'), 'Ted', "default value is overridden when the property is set");
  });
});

test("default values are not used when the value is set to a falsy value", function() {
  store.push({
    type: 'person',
    id: 1,
    attributes: {}
  });

  return store.find('person', 1).then(function(person) {
    person.set('firstName', null);
    equal(person.get('firstName'), null, "default value is not used when the value is set to null");
    person.set('firstName', undefined);
    equal(person.get('firstName'), undefined, "default value is not used when the value is set to undefined");
  });
});
