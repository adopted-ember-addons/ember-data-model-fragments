import Model from '@ember-data/model';
import { fragmentOwner } from '#src/attributes/index.ts';
import { module, test } from 'qunit';
import { setupApplicationTest } from '../helpers/index.ts';
import type { TestContext, TestStore } from '../helpers/index.ts';

let store: TestStore;
let owner: any;

module('unit - `MF.fragmentOwner` property', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function (this: TestContext) {
    owner = this.owner;
    store = owner.lookup('service:store');
  });

  hooks.afterEach(function (this: TestContext) {
    owner = null;
  });

  test('fragments can reference their owner record', async function (this: TestContext, assert: Assert) {
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
      'fragment owner property is reference to the owner record',
    );
  });

  test('using a fragment owner property on a non-fragment throws an error', function (this: TestContext, assert: Assert) {
    class InvalidModel extends Model {
      @fragmentOwner() declare owner: any;
    }

    owner.register('model:invalidModel', InvalidModel);

    const invalid = store.createRecord('invalidModel');

    assert.expectAssertion(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- reading the property is what triggers the assertion
      invalid.owner;
    }, 'Fragment owner properties can only be used on fragments.');
  });

  test("attempting to change a fragment's owner record throws an error", async function (this: TestContext, assert: Assert) {
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

    const people = await Promise.all([
      store.findRecord('person', 1),
      store.findRecord('person', 2),
    ]);
    const name = people[0].name;

    assert.throws(() => {
      name.set('person', people[1]);
    }, 'setting the owner property throws an error');
  });

  test('fragment owner properties are notified of change', async function (this: TestContext, assert: Assert) {
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
