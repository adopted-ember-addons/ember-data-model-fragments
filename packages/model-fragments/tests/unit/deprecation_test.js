var env, store, Person, Name, House;

QUnit.module("unit - Deprecations", {
  setup: function() {
    Person = DS.Model.extend({
      name: MF.fragment('name')
    });

    Name = MF.Fragment.extend({
      first: DS.attr('string'),
      last: DS.attr('string')
    });

    House = MF.Fragment.extend({
      name: DS.attr('string'),
      region: DS.attr('string'),
      exiled: DS.attr('boolean')
    });

    env = setupEnv({
      person: Person,
      name: Name,
      house: House
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

// Yay, no deprecations!
