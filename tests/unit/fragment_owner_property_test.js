import Model from '@ember-data/model';
import { fragmentOwner } from 'ember-data-model-fragments/attributes';
import { all } from 'rsvp';
import { module, test } from 'qunit';
import { setupApplicationTest } from '../helpers';

let store, owner;

module('unit - `MF.fragmentOwner` property', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    owner = this.owner;
    store = owner.lookup('service:store');
  });

  hooks.afterEach(function () {
    owner = null;
    store = null;
  });

  test('fragments can reference their owner record', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Samwell',
            last: 'Tarly',
          },
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const name = person.name;

    assert.equal(
      name.person,
      person,
      'fragment owner property is reference to the owner record'
    );
  });

  test('using a fragment owner property on a non-fragment throws an error', function (assert) {
    class InvalidModel extends Model {
      @fragmentOwner() owner;
    }

    owner.register('model:invalidModel', InvalidModel);

    const invalid = store.createRecord('invalidModel');

    assert.throws(
      () => {
        invalid.owner;
      },
      /Fragment owner properties can only be used on fragments/,
      'getting fragment owner on non-fragment throws an error'
    );
  });

  test("attempting to change a fragment's owner record throws an error", async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Samwell',
            last: 'Tarly',
          },
        },
      },
    });

    store.push({
      data: {
        type: 'person',
        id: 2,
        attributes: {
          name: {
            first: 'Samwell',
            last: 'Tarly',
          },
        },
      },
    });

    const people = await all([
      store.findRecord('person', 1),
      store.findRecord('person', 2),
    ]);
    const name = people[0].name;

    assert.throws(() => {
      name.set('person', people[1]);
    }, 'setting the owner property throws an error');
  });

  test('fragment owner properties are notified of change', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Jeyne',
            last: 'Poole',
          },
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const name = store.createFragment('name', {
      first: 'Arya',
      last: 'Stark',
    });

    assert.ok(!name.person, 'fragment owner property is null');

    person.set('name', name);

    assert.equal(name.person, person, 'fragment owner property is updated');
  });
});
