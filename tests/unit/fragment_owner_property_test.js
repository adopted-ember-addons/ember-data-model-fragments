import Model from '@ember-data/model';
import { run } from '@ember/runloop';
import { all } from 'rsvp';
import MF from 'ember-data-model-fragments';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';

let store, owner;

module('unit - `MF.fragmentOwner` property', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function (assert) {
    owner = this.owner;
    store = owner.lookup('service:store');

    assert.expectNoDeprecation();
  });

  hooks.afterEach(function () {
    owner = null;
    store = null;
  });

  test('fragments can reference their owner record', function (assert) {
    run(() => {
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

      return store.find('person', 1).then((person) => {
        let name = person.get('name');

        assert.equal(
          name.get('person'),
          person,
          'fragment owner property is reference to the owner record'
        );
      });
    });
  });

  test('using a fragment owner property on a non-fragment throws an error', function (assert) {
    run(() => {
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
  });

  test("attempting to change a fragment's owner record throws an error", function (assert) {
    run(() => {
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

      return all([store.find('person', 1), store.find('person', 2)]).then(
        (people) => {
          let name = people[0].get('name');

          assert.throws(() => {
            name.set('person', people[1]);
          }, 'setting the owner property throws an error');
        }
      );
    });
  });

  test('fragment owner properties are notified of change', function (assert) {
    run(() => {
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

      return store.find('person', 1).then((person) => {
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
  });
});
