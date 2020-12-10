import { run } from '@ember/runloop';
import { all } from 'rsvp';
import { Copyable } from 'ember-copy';
import Ember from 'ember';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';

let store;

module('unit - `MF.Fragment`', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function() {
    store = this.owner.lookup('service:store');
  });

  hooks.afterEach(function() {
    store = null;
  });

  test('fragments are `Copyable`', function(assert) {
    run(() => {
      let fragment = store.createFragment('name');

      assert.ok(Copyable.detect(fragment), 'fragments are copyable');
    });
  });

  test('copied fragments can be added to any record', function(assert) {
    run(() => {
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
    run(() => {
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
    run(() => {
      let fragment = store.createFragment('name');

      assert.ok(Ember.Comparable.detect(fragment), 'fragments are comparable');
    });
  });

  test('fragments are compared by reference', function(assert) {
    run(() => {
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
    run(() => {
      let fragment = store.createFragment('name');

      assert.ok(fragment.get('isNew'), 'fragments start as new');
    });
  });

  test('changes to fragments are indicated in the owner record\'s `changedAttributes`', function(assert) {
    run(() => {
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
        const expectedChanges = [];

        expectedChanges.push(name);
        name.set('last', 'Baratheon');
        expectedChanges.push(person.get('name'));

        assert.deepEqual(person.changedAttributes().name, expectedChanges, 'changed fragments are indicated in the diff object');
      });
    });
  });

  test('fragment properties that are set to null are indicated in the owner record\'s `changedAttributes`', function(assert) {
    run(() => {
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
        const expectedChanges = [];

        expectedChanges.push(person.get('name'));
        person.set('name', null);
        expectedChanges.push(person.get('name'));

        assert.deepEqual(person.changedAttributes().name, expectedChanges, 'null fragments are indicated in the diff object');
      });
    });
  });

  test('changes to attributes can be rolled back', function(assert) {
    run(() => {
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
    run(() => {
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
      run(() => {
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
      run(() => {
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
    run(() => zoo.get('manager'));
    run(() => zoo.get('star'));

    assert.equal(person.get('title'), 'Zoo Manager', 'Person has the right title');
    assert.equal(zoo.get('manager.content'), person, 'Manager relationship was correctly loaded');
    assert.equal(zoo.get('star.name'), 'Sabu', 'Elephant fragment has the right name.');
    assert.notOk(isUnloaded(person), 'Person is no destroyed');
    assert.notOk(isUnloaded(zoo), 'Zoo is not destroyed');
    assert.notOk(isUnloaded(zoo.get('star')), 'Fragment is not destroyed');

    // Unload the record
    run(() => zoo.unloadRecord());

    assert.notOk(isUnloaded(person), 'Person was not unloaded');
    // We'd like to test that the records are unloaded, but the hueristics for that
    // are different between ember-data-2.11, ember-data-2.12, and ember-data-2.13.
    // assert.ok(isUnloaded(zoo), 'Zoo was unloaded');
    // assert.ok(isUnloaded(zoo.get('star')), 'Fragment is now unloaded');

    // Load a new record
    let origZoo = zoo;
    zoo = pushZoo();
    run(() => zoo.get('star')); // Prime the fragment on the new model

    // Make sure the reloaded record is new and has the right data
    assert.notOk(isUnloaded(zoo), 'Zoo was unloaded');
    assert.notOk(isUnloaded(zoo.get('star')), 'Fragment is now unloaded');
    assert.equal(zoo.get('manager.content'), person, 'Manager relationship was correctly loaded');
    assert.equal(zoo.get('star.name'), 'Sabu', 'Elephant fragment has the right name.');

    assert.ok(zoo !== origZoo, 'A different instance of the zoo model was loaded');
    assert.ok(zoo.get('star') !== origZoo.get('star'), 'Fragments were not reused');
  });

  test('fragments call ready callback when they are created', function(assert) {
    run(() => {
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

  test('fragments update on push with `null`', function(assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: { first: 'Jon' },
          names: [{ first: 'Jon' }]
        }
      }
    });

    let person = store.peekRecord('person', 1);
    assert.deepEqual(person.name.serialize(), { first: 'Jon', last: null }, 'name is correct');
    assert.deepEqual(person.names.serialize(), [{ first: 'Jon', last: null }], 'names is correct');

    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: null,
          names: null
        }
      }
    });

    assert.strictEqual(person.name, null);
    assert.strictEqual(person.names, null);

    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: { first: 'Jon!', last: 'Snow' },
          names: [{ first: 'Jon!', last: 'Snow' }]
        }
      }
    });

    assert.deepEqual(person.name.serialize(), { first: 'Jon!', last: 'Snow' }, 'name is correct');
    assert.deepEqual(person.names.serialize(), [{ first: 'Jon!', last: 'Snow' }], 'names is correct');
  });
});
