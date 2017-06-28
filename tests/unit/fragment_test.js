import Ember from 'ember';
import { test } from 'qunit';
import moduleForAcceptance from '../helpers/module-for-acceptance';
import getOwner from '../helpers/get-owner';

let store;
let all = Ember.RSVP.all;

moduleForAcceptance('unit - `MF.Fragment`', {
  beforeEach() {
    store = getOwner(this).lookup('service:store');
  },

  afterEach() {
    store = null;
  }
});

test('fragments are `Ember.Copyable`', function(assert) {
  Ember.run(() => {
    let fragment = store.createFragment('name');

    assert.ok(Ember.Copyable.detect(fragment), 'fragments are copyable');
  });
});

test('copied fragments can be added to any record', function(assert) {
  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Jon',
            last: 'Snow'
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
    ]).then(people => {
      let copy = people[0].get('name').copy();

      people[1].set('name', copy);

      assert.ok(true, 'fragment copies can be assigned to other records');
    });
  });
});

test('copying a fragment copies the fragment\'s properties', function(assert) {
  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Jon',
            last: 'Snow'
          }
        }
      }
    });

    return store.find('person', 1).then(person => {
      let copy = person.get('name').copy();

      assert.ok(copy.get('first'), 'Jon');
      assert.ok(copy.get('last'), 'Snow');
    });
  });
});

test('fragments are `Ember.Comparable`', function(assert) {
  Ember.run(() => {
    let fragment = store.createFragment('name');

    assert.ok(Ember.Comparable.detect(fragment), 'fragments are comparable');
  });
});

test('fragments are compared by reference', function(assert) {
  Ember.run(() => {
    let fragment1 = store.createFragment('name', {
      first: 'Jon',
      last: 'Arryn'
    });
    let fragment2 = store.createFragment('name', {
      first: 'Jon',
      last: 'Arryn'
    });

    assert.ok(fragment1.compare(fragment1, fragment2) !== 0, 'deeply equal objects are not the same');
    assert.ok(fragment1.compare(fragment1, fragment1) === 0, 'identical objects are the same');
  });
});

test('newly create fragments start in the new state', function(assert) {
  Ember.run(() => {
    let fragment = store.createFragment('name');

    assert.ok(fragment.get('isNew'), 'fragments start as new');
  });
});

test('changes to fragments are indicated in the owner record\'s `changedAttributes`', function(assert) {
  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Loras',
            last: 'Tyrell'
          }
        }
      }
    });

    return store.find('person', 1).then(person => {
      let name = person.get('name');

      name.set('last', 'Baratheon');

      assert.equal(person.changedAttributes().name, true, 'changed fragments are indicated in the diff object');
    });
  });
});

test('fragment properties that are set to null are indicated in the owner record\'s `changedAttributes`', function(assert) {
  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Rob',
            last: 'Stark'
          }
        }
      }
    });

    return store.find('person', 1).then(person => {
      person.set('name', null);

      assert.equal(person.changedAttributes().name, true, 'null fragments are indicated in the diff object');
    });
  });
});

test('changes to attributes can be rolled back', function(assert) {
  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Ramsay',
            last: 'Snow'
          }
        }
      }
    });

    return store.find('person', 1).then(person => {
      let name = person.get('name');

      name.set('last', 'Bolton');
      name.rollbackAttributes();

      assert.ok(name.get('last', 'Snow'), 'fragment properties are restored');
      assert.ok(!name.get('hasDirtyAttributes'), 'fragment is in clean state');
    });
  });
});

test('fragments without an owner can be destroyed', function(assert) {
  Ember.run(() => {
    let fragment = store.createFragment('name');
    fragment.destroy();
    assert.ok(fragment.get('isDestroying'), 'the fragment is being destroyed');
  });
});

test('fragments unloaded/reload w/ relationship', function(assert) {
  // Related to: https://github.com/lytics/ember-data-model-fragments/issues/261

  function isUnloaded(recordOrFragment) {
    // Ember-2.13 and newer uses `recordOrFragment.isDestroyed`
    return recordOrFragment.isDestroyed;
  }

  function pushPerson() {
    Ember.run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            title: 'Zoo Manager'
          }
        }
      });
    });
    return store.peekRecord('person', 1);
  }

  function pushZoo() {
    Ember.run(() => {
      store.push({
        data: {
          type: 'zoo',
          id: 1,
          attributes: {
            name: 'Cincinnati Zoo',
            star: {
              $type: 'elephant',
              name: 'Sabu'
            }
          },
          relationships: {
            manager: {
              data: { type: 'person', id: 1 }
            }
          }
        }
      });
    });
    return store.peekRecord('zoo', 1);
  }

  let person = pushPerson();
  let zoo = pushZoo();

  // Prime the relationship and fragment
  Ember.run(() => zoo.get('manager'));
  Ember.run(() => zoo.get('star'));

  assert.equal(person.get('title'), 'Zoo Manager', 'Person has the right title');
  assert.equal(zoo.get('manager.content'), person, 'Manager relationship was correctly loaded');
  assert.equal(zoo.get('star.name'), 'Sabu', 'Elephant fragment has the right name.');
  assert.notOk(isUnloaded(person), 'Person is no destroyed');
  assert.notOk(isUnloaded(zoo), 'Zoo is not destroyed');
  assert.notOk(isUnloaded(zoo.get('star')), 'Fragment is not destroyed');

  // Unload the record
  Ember.run(() => zoo.unloadRecord());

  assert.notOk(isUnloaded(person), 'Person was not unloaded');
  // We'd like to test that the records are unloaded, but the hueristics for that
  // are different between ember-data-2.11, ember-data-2.12, and ember-data-2.13.
  // assert.ok(isUnloaded(zoo), 'Zoo was unloaded');
  // assert.ok(isUnloaded(zoo.get('star')), 'Fragment is now unloaded');

  // Load a new record
  let origZoo = zoo;
  zoo = pushZoo();
  Ember.run(() => zoo.get('star')); // Prime the fragment on the new model

  // Make sure the reloaded record is new and has the right data
  assert.notOk(isUnloaded(zoo), 'Zoo was unloaded');
  assert.notOk(isUnloaded(zoo.get('star')), 'Fragment is now unloaded');
  assert.equal(zoo.get('manager.content'), person, 'Manager relationship was correctly loaded');
  assert.equal(zoo.get('star.name'), 'Sabu', 'Elephant fragment has the right name.');

  assert.ok(zoo !== origZoo, 'A different instance of the zoo model was loaded');
  assert.ok(zoo.get('star') !== origZoo.get('star'), 'Fragments were not reused');
});

test('fragments call ready callback when they are created', function(assert) {
  Ember.run(() => {
    let name = store.createFragment('name');
    assert.ok(name.get('readyWasCalled'), 'when making fragment directly with store.createFragment');

    let person = store.createRecord('person', {
      name: { first: 'dan' },
      names: [{ first: 'eric' }]
    });

    assert.ok(person.get('name.readyWasCalled'), 'when creating model that has fragment');
    assert.ok(person.get('names').isEvery('readyWasCalled'), 'when creating model that has fragmentArray');
  });
});
