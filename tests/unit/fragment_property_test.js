import { run, schedule } from '@ember/runloop';
import EmberObject from '@ember/object';
import { all } from 'rsvp';
import { copy } from 'ember-copy';
import DS from 'ember-data';
import MF from 'ember-data-model-fragments';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import Name from 'dummy/models/name';
import Pretender from 'pretender';

let store, owner, server;

module('unit - `MF.fragment` property', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function(assert) {
    owner = this.owner;
    store = owner.lookup('service:store');
    server = new Pretender();

    assert.expectNoDeprecation();
  });

  hooks.afterEach(function() {
    owner = null;
    store = null;
    server.shutdown();
  });

  test('object literals are converted to instances of `MF.Fragment`', function(assert) {
    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: 'Tyrion',
              last: 'Lannister'
            }
          }
        }
      });

      return store.find('person', 1).then(person => {
        assert.ok(person.get('name') instanceof Name, 'name property is an `MF.Fragment` instance');

        assert.equal(person.get('name.first'), 'Tyrion', 'nested properties have original value');
      });
    });
  });

  test('a fragment can be created through the store and set', function(assert) {
    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {}
        }
      });

      return store.find('person', 1).then(person => {
        let name = store.createFragment('name', {
          first: 'Davos',
          last: 'Seaworth'
        });

        person.set('name', name);

        assert.equal(person.get('name.first'), 'Davos', 'new fragment is correctly set');
      });
    });
  });

  test('a fragment set to null can be recreated through the store with a non null value', function(assert) {
    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attribtues: {
            name: null
          }
        }
      });
      store.find('person', 1).then(() => {
        store.push({
          data: {
            type: 'person',
            id: 1,
            attributes: {
              name: {
                first: 'Bob',
                last: 'Smith'
              }
            }
          }
        });
        return store.find('person', 1).then(person => {
          assert.equal(person.get('name.first'), 'Bob', 'New name is set correctly');
        });
      });
    });
  });

  test('setting to a non-fragment or object literal throws an error', function(assert) {
    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {}
        }
      });

      return store.find('person', 1).then(person => {
        assert.throws(() => {
          person.set('name', store.createRecord('person'));
        }, 'error is thrown when setting non-fragment');
      });
    });
  });

  test('setting fragments from other records throws an error', function(assert) {
    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: 'Roose',
              last: 'Bolton'
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
        assert.throws(() => {
          people[1].set('name', people[0].get('name'));
        }, 'error is thrown when setting to a fragment of another record');
      });
    });
  });

  test('null values are allowed', function(assert) {
    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: null
          }
        }
      });

      return store.find('person', 1).then(person => {
        assert.equal(person.get('name'), null, 'property is null');
      });
    });
  });

  test('setting to null is allowed', function(assert) {
    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: 'Barristan',
              last: 'Selmy'
            }
          }
        }
      });

      return store.find('person', 1).then(person => {
        person.set('name', null);
        assert.equal(person.get('name'), null, 'property is null');
      });
    });
  });

  test('fragments are created from object literals when creating a record', function(assert) {
    run(() => {
      let name = {
        first: 'Balon',
        last: 'Greyjoy'
      };

      let person = store.createRecord('person', {
        name: name
      });

      assert.ok(person.get('name') instanceof MF.Fragment, 'a `MF.Fragment` instance is created');
      assert.equal(person.get('name.first'), name.first, 'fragment has correct values');
    });
  });

  test('setting a fragment to an object literal creates a new fragment', function(assert) {
    let name = {
      first: 'Asha',
      last: 'Greyjoy'
    };

    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: null
          }
        }
      });

      return store.find('person', 1).then(person => {
        person.set('name', name);

        assert.ok(person.get('name') instanceof MF.Fragment, 'a `MF.Fragment` instance is created');
        assert.equal(person.get('name.first'), name.first, 'fragment has correct values');
      });
    });
  });

  test('setting a fragment to an object literal reuses an existing fragment', function(assert) {
    let newName = {
      first: 'Reek',
      last: null
    };

    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: 'Theon',
              last: 'Greyjoy'
            }
          }
        }
      });

      return store.find('person', 1).then(person => {
        let name = person.get('name');

        person.set('name', newName);

        assert.equal(name, person.get('name'), 'fragment instances are reused');
        assert.equal(person.get('name.first'), newName.first, 'fragment has correct values');
      });
    });
  });

  test('fragments can be saved with values, then have a value set to null without causing error', function(assert) {
    run(() => {
      let defaultValue = {
        first: 'Iron',
        last: 'Victory'
      };

      let Ship = DS.Model.extend({
        name: MF.fragment('name', { defaultValue: defaultValue })
      });

      owner.register('model:ship', Ship);

      let ship = store.createRecord('ship');

      let payload = {
        ship: copy(defaultValue, true)
      };
      payload.ship.id = 3;

      server.post('/ships', () => {
        return [200, { 'Content-Type': 'application/json' }, JSON.stringify(payload)];
      });

      return ship.save().then(ship => {
        assert.equal(ship.get('name.first'), defaultValue.first, 'the value is set as it was saved');

        ship.set('name.first', null);
        assert.equal(ship.get('name.first'), null, 'the value is successfully set to null');
      });

    });
  });

  test('fragments can have default values', function(assert) {
    run(() => {
      let defaultValue = {
        first: 'Iron',
        last: 'Victory'
      };

      let Ship = DS.Model.extend({
        name: MF.fragment('name', { defaultValue: defaultValue })
      });

      owner.register('model:ship', Ship);

      let ship = store.createRecord('ship');

      assert.equal(ship.get('name.first'), defaultValue.first, 'the default value is used when the value has not been specified');

      ship.set('name', null);
      assert.equal(ship.get('name'), null, 'the default value is not used when the value is set to null');

      ship = store.createRecord('ship', { name: null });
      assert.equal(ship.get('name'), null, 'the default value is not used when the value is initialized to null');
    });
  });

  test('fragment default values can be functions', function(assert) {
    run(() => {
      let defaultValue = {
        first: 'Oath',
        last: 'Keeper'
      };

      let Sword = DS.Model.extend({
        name: MF.fragment('name', { defaultValue() { return defaultValue; } })
      });

      owner.register('model:sword', Sword);

      let sword = store.createRecord('sword');

      assert.equal(sword.get('name.first'), defaultValue.first, 'the default value is correct');
    });
  });

  test('fragment default values that are functions are not deep copied', function(assert) {
    run(() => {
      let defaultValue = {
        first: 'Oath',
        last: 'Keeper',
        uncopyableObject: EmberObject.create({ item: 'Longclaw' })  // Will throw an error if copied
      };

      let Sword = DS.Model.extend({
        name: MF.fragment('name', { defaultValue() { return defaultValue; } })
      });

      owner.register('model:sword', Sword);

      let sword = store.createRecord('sword');

      assert.equal(sword.get('name.first'), defaultValue.first, 'the default value is correct');
    });
  });

  test('destroy a fragment which was set to null', function(assert) {
    return run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: 'Barristan',
              last: 'Selmy'
            }
          }
        }
      });

      return store.find('person', 1).then(person => {
        let name = person.get('name');
        person.set('name', null);

        person.destroy();

        schedule('destroy', () => {
          assert.ok(person.get('isDestroying'), 'the model is being destroyed');
          assert.ok(name.get('isDestroying'), 'the fragment is being destroyed');
        });
      });
    });
  });

  test('destroy the old and new fragment value', function(assert) {
    return run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: 'Barristan',
              last: 'Selmy'
            }
          }
        }
      });

      return store.find('person', 1).then(person => {
        let oldName = person.get('name');
        let newName = store.createFragment('name');
        person.set('name', newName);

        assert.ok(!oldName.get('isDestroying'), 'don\'t destroy the old fragment yet because we could rollback');

        person.destroy();

        schedule('destroy', () => {
          assert.ok(person.get('isDestroying'), 'the model is being destroyed');
          assert.ok(oldName.get('isDestroying'), 'the old fragment is being destroyed');
          assert.ok(newName.get('isDestroying'), 'the new fragment is being destroyed');
        });
      });
    });
  });
});
