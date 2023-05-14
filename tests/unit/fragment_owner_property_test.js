import Model from '@ember-data/model';
import { all } from 'rsvp';
import MF from 'ember-data-model-fragments';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';

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

    const person = await store.find('person', 1);
    let name = person.get('name');

    assert.equal(
      name.get('person'),
      person,
      'fragment owner property is reference to the owner record'
    );
  });

  test('using a fragment owner property on a non-fragment throws an error', function (assert) {
    let InvalidModel = Model.extend({
      owner: MF.fragmentOwner(),
    });

    owner.register('model:invalidModel', InvalidModel);

    let invalid = store.createRecord('invalidModel');

    assert.throws(
      () => {
        invalid.get('owner');
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
      store.find('person', 1),
      store.find('person', 2),
    ]);
    let name = people[0].get('name');

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

    const person = await store.find('person', 1);
    let name = store.createFragment('name', {
      first: 'Arya',
      last: 'Stark',
    });

    assert.ok(!name.get('person'), 'fragment owner property is null');

    person.set('name', name);

    assert.equal(
      name.get('person'),
      person,
      'fragment owner property is updated'
    );
  });
});
