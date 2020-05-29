import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
let store;

// `contains` was deprecated in Ember 2.8. Replaced with `includes`.
// Use `includes` when possible because if using >= ember-2-8, `contains` will produce a deprecation.
function includes(array, item) {
  return array.includes ? array.includes(item) : array.contains(item);
}

module('unit - `MF.fragmentArray`', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function(assert) {
    store = this.owner.lookup('service:store');

    assert.expectNoDeprecation();
  });

  hooks.afterEach(function() {
    store = null;
  });

  test('fragment arrays can be copied', function(assert) {
    let data = {
      names: [
        {
          first: 'Meryn',
          last: 'Trant'
        }
      ]
    };

    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: data
        }
      });

      return store.find('person', 1).then(person => {
        let copy = person.get('names').copy();

        assert.equal(copy.length, person.get('names.length'), 'copy\'s size is correct');
        assert.equal(copy[0].get('first'), data.names[0].first, 'child fragments are copied');
        assert.ok(copy[0] !== person.get('names.firstObject'), 'copied fragments are new fragments');
      });
    });
  });

  test('fragments can be created and added through the fragment array', function(assert) {
    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            names: [
              {
                first: 'Tyrion',
                last: 'Lannister'
              }
            ]
          }
        }
      });

      return store.find('person', 1).then(person => {
        let fragments = person.get('names');
        let length = fragments.get('length');

        let fragment = fragments.createFragment({
          first: 'Hugor',
          last: 'Hill'
        });

        assert.equal(fragments.get('length'), length + 1, 'property size is correct');
        assert.equal(fragments.indexOf(fragment), length, 'new fragment is in correct location');
      });
    });
  });

  test('fragments can be added to the fragment array', function(assert) {
    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            names: [
              {
                first: 'Tyrion',
                last: 'Lannister'
              }
            ]
          }
        }
      });

      return store.find('person', 1).then(person => {
        let fragments = person.get('names');
        let length = fragments.get('length');

        let fragment = store.createFragment('name', {
          first: 'Yollo'
        });

        fragments.addFragment(fragment);

        assert.equal(fragments.get('length'), length + 1, 'property size is correct');
        assert.equal(fragments.indexOf(fragment), length, 'fragment is in correct location');
      });
    });
  });

  test('fragment arrays can be added to fragments', function(assert) {
    let order = store.createFragment('order', {
      amount: '799.98',
      products: [
        {
          name: 'Tears of Lys',
          sku: 'poison-bd-32',
          price: '499.99'
        },
        {
          name: 'The Strangler',
          sku: 'poison-md-24',
          price: '299.99'
        }
      ]
    });
    let user = store.createRecord('user', {
      info: {
        name: 'Tyrion Lannister',
        notes: ['smart', 'short']
      },
      orders: [
        {
          amount: '799.98',
          products: order.products
        }
      ]
    });
    assert.equal(user.orders.firstObject.products.firstObject.name, 'Tears of Lys', 'No problems');
  });

  test('fragments can be removed from the fragment array', function(assert) {
    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            names: [
              {
                first: 'Arya',
                last: 'Stark'
              }
            ]
          }
        }
      });

      return store.find('person', 1).then(person => {
        let fragments = person.get('names');
        let fragment = fragments.get('firstObject');
        let length = fragments.get('length');

        fragments.removeFragment(fragment);

        assert.equal(fragments.get('length'), length - 1, 'property size is correct');
        assert.ok(!includes(fragments, fragment), 'fragment is removed');
      });
    });
  });

  test('changes to array contents change the fragment array `hasDirtyAttributes` property', function(assert) {
    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            names: [
              {
                first: 'Aegon',
                last: 'Targaryen'
              },
              {
                first: 'Visenya',
                last: 'Targaryen'
              }
            ]
          }
        }
      });

      return store.find('person', 1).then(person => {
        let fragments = person.get('names');
        let fragment = fragments.get('firstObject');
        let newFragment = store.createFragment('name', {
          first: 'Rhaenys',
          last: 'Targaryen'
        });

        assert.ok(!fragments.get('hasDirtyAttributes'), 'fragment array is initially in a clean state');

        fragments.removeFragment(fragment);

        assert.ok(fragments.get('hasDirtyAttributes'), 'fragment array is in dirty state after removal');

        fragments.unshiftObject(fragment);

        assert.ok(!fragments.get('hasDirtyAttributes'), 'fragment array is returned to clean state');

        fragments.addFragment(newFragment);

        assert.ok(fragments.get('hasDirtyAttributes'), 'fragment array is in dirty state after addition');

        fragments.removeFragment(newFragment);

        assert.ok(!fragments.get('hasDirtyAttributes'), 'fragment array is returned to clean state');

        fragments.removeFragment(fragment);
        fragments.addFragment(fragment);

        assert.ok(fragments.get('hasDirtyAttributes'), 'fragment array is in dirty state after reordering');

        fragments.removeFragment(fragment);
        fragments.unshiftObject(fragment);

        assert.ok(!fragments.get('hasDirtyAttributes'), 'fragment array is returned to clean state');
      });
    });
  });

  test('changes to array contents change the fragment array `hasDirtyAttributes` property', function(assert) {
    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            names: [
              {
                first: 'Jon',
                last: 'Snow'
              }
            ]
          }
        }
      });

      return store.find('person', 1).then(person => {
        let fragments = person.get('names');
        let fragment = fragments.get('firstObject');

        assert.ok(!fragments.get('hasDirtyAttributes'), 'fragment array is initially in a clean state');

        fragment.set('last', 'Stark');

        assert.ok(fragments.get('hasDirtyAttributes'), 'fragment array in dirty state after change to a fragment');

        fragment.set('last', 'Snow');

        assert.ok(!fragments.get('hasDirtyAttributes'), 'fragment array is returned to clean state');
      });
    });
  });

  test('changes to array contents and fragments can be rolled back', function(assert) {
    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            names: [
              {
                first: 'Catelyn',
                last: 'Tully'
              },
              {
                first: 'Catelyn',
                last: 'Stark'
              }
            ]
          }
        }
      });

      return store.find('person', 1).then(person => {
        let fragments = person.get('names');
        let fragment = fragments.get('firstObject');

        let originalState = fragments.toArray();

        fragment.set('first', 'Cat');
        fragments.removeFragment(fragments.get('lastObject'));
        fragments.createFragment({
          first: 'Lady',
          last: 'Stonehart'
        });

        fragments.rollbackAttributes();

        assert.ok(!fragments.get('hasDirtyAttributes'), 'fragment array is not dirty');
        assert.ok(!fragments.isAny('hasDirtyAttributes'), 'all fragments are in clean state');
        assert.deepEqual(fragments.toArray(), originalState, 'original array contents is restored');
      });
    });
  });
});
