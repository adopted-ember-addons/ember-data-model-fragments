import Ember from 'ember';
import { test } from 'qunit';
import moduleForAcceptance from '../helpers/module-for-acceptance';
var store;
var all = Ember.RSVP.all;

moduleForAcceptance("unit - `MF.Fragment`", {
  beforeEach: function() {
    store = this.application.__container__.lookup('service:store');
  },

  afterEach: function() {
    store = null;
  }
});

test("fragments are `Ember.Copyable`", function(assert) {
  Ember.run(() => {
    var fragment = store.createFragment('name');

    assert.ok(Ember.Copyable.detect(fragment), "fragments are copyable");
  });
});

test("copied fragments can be added to any record", function(assert) {
  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: "Jon",
            last: "Snow"
          }
        }
      }
    });

    store.push({
      data: {
        type: 'person',
        id: 2,
        attributes: {}
      }
    });

    return all([
      store.find('person', 1),
      store.find('person', 2)
    ]).then(function(people) {
      var copy = people[0].get('name').copy();

      people[1].set('name', copy);

      assert.ok(true, "fragment copies can be assigned to other records");
    });
  });
});

test("copying a fragment copies the fragment's properties", function(assert) {
  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: "Jon",
            last: "Snow"
          }
        }
      }
    });

    return store.find('person', 1).then(function(person) {
      var copy = person.get('name').copy();

      assert.ok(copy.get('first'), "Jon");
      assert.ok(copy.get('last'), "Snow");
    });
  });
});

test("fragments are `Ember.Comparable`", function(assert) {
  Ember.run(() => {
    var fragment = store.createFragment('name');

    assert.ok(Ember.Comparable.detect(fragment), "fragments are comparable");
  });
});

test("fragments are compared by reference", function(assert) {
  Ember.run(() => {
    var fragment1 = store.createFragment('name', {
      first: "Jon",
      last: "Arryn"
    });
    var fragment2 = store.createFragment('name', {
      first: "Jon",
      last: "Arryn"
    });

    assert.ok(fragment1.compare(fragment1, fragment2) !== 0, "deeply equal objects are not the same");
    assert.ok(fragment1.compare(fragment1, fragment1) === 0, "identical objects are the same");
  });
});

test("newly create fragments start in the new state", function(assert) {
  Ember.run(() => {
    var fragment = store.createFragment('name');

    assert.ok(fragment.get('isNew'), "fragments start as new");
  });
});

test("changes to fragments are indicated in the owner record's `changedAttributes`", function(assert) {
  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: "Loras",
            last: "Tyrell"
          }
        }
      }
    });

    return store.find('person', 1).then(function(person) {
      var name = person.get('name');

      name.set('last', 'Baratheon');

      assert.equal(person.changedAttributes().name, true, "changed fragments are indicated in the diff object");
    });
  });
});

test("fragment properties that are set to null are indicated in the owner record's `changedAttributes`", function(assert) {
  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: "Rob",
            last: "Stark"
          }
        }
      }
    });

    return store.find('person', 1).then(function(person) {
      person.set('name', null);

      assert.equal(person.changedAttributes().name, true, "null fragments are indicated in the diff object");
    });
  });
});

test("changes to attributes can be rolled back", function(assert) {
  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: "Ramsay",
            last: "Snow"
          }
        }
      }
    });

    return store.find('person', 1).then(function(person) {
      var name = person.get('name');

      name.set('last', 'Bolton');
      name.rollbackAttributes();

      assert.ok(name.get('last', 'Snow'), "fragment properties are restored");
      assert.ok(!name.get('hasDirtyAttributes'), "fragment is in clean state");
    });
  });
});

test("fragments without an owner can be destroyed", function(assert) {
  Ember.run(() => {
    var fragment = store.createFragment('name');
    fragment.destroy();
    assert.ok(fragment.get('isDestroying'), "the fragment is being destroyed");
  });
});
