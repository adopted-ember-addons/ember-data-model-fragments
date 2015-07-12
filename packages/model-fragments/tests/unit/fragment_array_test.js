var env, store, Person, Name;

module("unit/fragments - DS.FragmentArray", {
  setup: function() {
    Person = DS.Model.extend({
      names: DS.hasManyFragments("name")
    });

    Name = DS.ModelFragment.extend({
      first : DS.attr("string"),
      last  : DS.attr("string")
    });

    env = setupEnv({
      person: Person,
      name: Name
    });

    store = env.store;
  },

  teardown: function() {
    env = null;
    store = null;
    Person = null;
    Name = null;
  }
});

test("fragments can be created and added through the fragment array", function() {
  store.push({
    type: 'person',
    id: 1,
    attributes: {
      names: [
        {
          first: "Tyrion",
          last: "Lannister"
        }
      ]
    }
  });

  return store.find('person', 1).then(function(person) {
    var fragments = person.get('names');
    var length = fragments.get('length');

    var fragment = fragments.createFragment({
      first: "Hugor",
      last: "Hill"
    });

    equal(fragments.get('length'), length + 1, "property size is correct");
    equal(fragments.indexOf(fragment), length, "new fragment is in correct location");
  });
});

test("fragments can be added to the fragment array", function() {
  store.push({
    type: 'person',
    id: 1,
    attributes: {
      names: [
        {
          first: "Tyrion",
          last: "Lannister"
        }
      ]
    }
  });

  return store.find('person', 1).then(function(person) {
    var fragments = person.get('names');
    var length = fragments.get('length');

    var fragment = store.createFragment('name', {
      first: "Yollo"
    });

    fragments.addFragment(fragment);

    equal(fragments.get('length'), length + 1, "property size is correct");
    equal(fragments.indexOf(fragment), length, "fragment is in correct location");
  });
});

test("fragments can be removed from the fragment array", function() {
  store.push({
    type: 'person',
    id: 1,
    attributes: {
      names: [
        {
          first: "Arya",
          last: "Stark"
        }
      ]
    }
  });

  return store.find('person', 1).then(function(person) {
    var fragments = person.get('names');
    var fragment = fragments.get('firstObject');
    var length = fragments.get('length');

    fragments.removeFragment(fragment);

    equal(fragments.get('length'), length - 1, "property size is correct");
    ok(!fragments.contains(fragment), "fragment is removed");
  });
});

test("changes to array contents change the fragment array 'isDirty' property", function() {
  store.push({
    type: 'person',
    id: 1,
    attributes: {
      names: [
        {
          first: "Aegon",
          last: "Targaryen"
        },
        {
          first: "Visenya",
          last: "Targaryen"
        }
      ]
    }
  });

  return store.find('person', 1).then(function(person) {
    var fragments = person.get('names');
    var fragment = fragments.get('firstObject');
    var newFragment = store.createFragment('name', {
      first: 'Rhaenys',
      last: 'Targaryen'
    });

    ok(!fragments.get('isDirty'), "fragment array is initially in a clean state");

    fragments.removeFragment(fragment);

    ok(fragments.get('isDirty'), "fragment array is in dirty state after removal");

    fragments.unshiftObject(fragment);

    ok(!fragments.get('isDirty'), "fragment array is returned to clean state");

    fragments.addFragment(newFragment);

    ok(fragments.get('isDirty'), "fragment array is in dirty state after addition");

    fragments.removeFragment(newFragment);

    ok(!fragments.get('isDirty'), "fragment array is returned to clean state");

    fragments.removeFragment(fragment);
    fragments.addFragment(fragment);

    ok(fragments.get('isDirty'), "fragment array is in dirty state after reordering");

    fragments.removeFragment(fragment);
    fragments.unshiftObject(fragment);

    ok(!fragments.get('isDirty'), "fragment array is returned to clean state");
  });
});

test("changes to array contents change the fragment array 'isDirty' property", function() {
  store.push({
    type: 'person',
    id: 1,
    attributes: {
      names: [
        {
          first: "Jon",
          last: "Snow"
        }
      ]
    }
  });

  return store.find('person', 1).then(function(person) {
    var fragments = person.get('names');
    var fragment = fragments.get('firstObject');

    ok(!fragments.get('isDirty'), "fragment array is initially in a clean state");

    fragment.set('last', 'Stark');

    ok(fragments.get('isDirty'), "fragment array in dirty state after change to a fragment");

    fragment.set('last', 'Snow');

    ok(!fragments.get('isDirty'), "fragment array is returned to clean state");
  });
});

test("changes to array contents and fragments can be rolled back", function() {
  store.push({
    type: 'person',
    id: 1,
    attributes: {
      names: [
        {
          first: "Catelyn",
          last: "Tully"
        },
        {
          first: "Catelyn",
          last: "Stark"
        }
      ]
    }
  });

  return store.find('person', 1).then(function(person) {
    var fragments = person.get('names');
    var fragment = fragments.get('firstObject');

    var originalState = fragments.toArray();

    fragment.set('first', 'Cat');
    fragments.removeFragment(fragments.get('lastObject'));
    fragments.createFragment({
      first: 'Lady',
      last: 'Stonehart'
    });

    fragments.rollback();

    ok(!fragments.get('isDirty'), "fragment array is not dirty");
    ok(!fragments.isAny('isDirty'), "all fragments are in clean state");
    deepEqual(fragments.toArray(), originalState, "original array contents is restored");
  });
});

test("serializing creates a new Array with contents the result of serializing each fragment", function() {
  // TODO: this is necessary to set `typeKey` and prevent `store#serializerFor` from blowing up
  store.modelFor('person');

  var names = [
    {
      first: "Rhaegar",
      last: "Targaryen"
    },
    {
      first: "Viserys",
      last: "Targaryen"
    },
    {
      first: "Daenerys",
      last: "Targaryen"
    }
  ];

  store.push({
    type: 'person',
    id: 1,
    attributes: {
      names: names
    }
  });

  env.registry.register('serializer:name', env.serializer);

  return store.find('person', 1).then(function(person) {
    var serialized = person.serialize();

    deepEqual(serialized.names, names, "serializing returns array of each fragment serialized");
  });
});
