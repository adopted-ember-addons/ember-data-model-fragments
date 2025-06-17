import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Model, { attr } from '@ember-data/model';
import Fragment from 'ember-data-model-fragments/fragment';
import {
  fragment,
  fragmentArray,
  array,
} from 'ember-data-model-fragments/attributes';
import { settled } from '@ember/test-helpers';

// Import our initializer to manually setup fragments in tests
import fragmentInitializer from 'ember-data-model-fragments/initializers/fragment-transforms';

module('Integration | Model Lifecycle', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    // Manually initialize fragment transforms for integration tests
    fragmentInitializer.initialize(this.owner);

    // Define test fragment models
    class NameFragment extends Fragment {
      static modelName = 'name';
      @attr('string') first;
      @attr('string') last;

      get fullName() {
        return `${this.get('first')} ${this.get('last')}`;
      }
    }

    class AddressFragment extends Fragment {
      static modelName = 'address';
      @attr('string') street;
      @attr('string') city;
      @attr('string') state;
      @attr('string') zip;
    }

    class ProductFragment extends Fragment {
      static modelName = 'product';
      @attr('string') name;
      @attr('string') sku;
      @attr('number') price;
    }

    class OrderFragment extends Fragment {
      static modelName = 'order';
      @attr('string') orderNumber;
      @attr('number') total;
      @fragmentArray('product') products;
    }

    // Define test models
    class PersonModel extends Model {
      @attr('string') firstName;
      @fragment('name') name;
      @fragmentArray('address') addresses;
      @array('string') tags;
      @fragmentArray('order') orders;
    }

    class CustomerModel extends Model {
      @attr('string') email;
      @fragment('name') contactName;
      @fragmentArray('address') billingAddresses;
      @array('string') preferences;
    }

    // Register models with test container
    this.owner.register('model:name', NameFragment);
    this.owner.register('model:address', AddressFragment);
    this.owner.register('model:product', ProductFragment);
    this.owner.register('model:order', OrderFragment);
    this.owner.register('model:person', PersonModel);
    this.owner.register('model:customer', CustomerModel);

    // Setup mock adapter for save/reload testing
    this.owner.register(
      'adapter:application',
      class MockAdapter extends Model.Adapter {
        updateRecord(store, type, snapshot) {
          // Mock successful save - return the same data
          const data = this.serialize(snapshot);
          return Promise.resolve({
            data: {
              type: snapshot.modelName,
              id: snapshot.id,
              attributes: data,
            },
          });
        }

        createRecord(store, type, snapshot) {
          // Mock successful create
          const data = this.serialize(snapshot);
          return Promise.resolve({
            data: {
              type: snapshot.modelName,
              id: '1', // Assign an ID
              attributes: data,
            },
          });
        }

        findRecord(store, type, id) {
          // Mock findRecord for reload testing
          if (type.modelName === 'person' && id === '1') {
            return Promise.resolve({
              data: {
                type: 'person',
                id: '1',
                attributes: {
                  firstName: 'Reloaded',
                  name: { first: 'Reloaded', last: 'Person' },
                  addresses: [
                    {
                      street: '999 Reload St',
                      city: 'Reload City',
                      state: 'RL',
                      zip: '99999',
                    },
                  ],
                  tags: ['reloaded', 'test'],
                },
              },
            });
          }
          return Promise.reject(new Error('Not found'));
        }

        serialize(snapshot) {
          const data = {};
          snapshot.eachAttribute((key, attribute) => {
            data[key] = snapshot.attr(key);
          });
          return data;
        }
      },
    );
  });

  test('model dirty tracking includes fragment changes', function (assert) {
    const store = this.owner.lookup('service:store');

    const person = store.createRecord('person', {
      firstName: 'John',
      name: { first: 'John', last: 'Doe' },
      addresses: [{ street: '123 Main St', city: 'Anytown' }],
      tags: ['developer'],
    });

    // Simulate clean state (like after save)
    const name = person.get('name');
    const addresses = person.get('addresses');
    const tags = person.get('tags');

    name._originalAttributes = { ...name._attributes };
    addresses._originalContent = addresses.slice();
    addresses.forEach(
      (addr) => (addr._originalAttributes = { ...addr._attributes }),
    );
    tags._originalContent = tags.slice();

    assert.false(person.get('hasDirtyAttributes'), 'Person starts clean');

    // Test fragment dirty state propagation
    name.set('first', 'Jane');
    assert.true(
      person.get('hasDirtyAttributes'),
      'Model dirty when fragment changes',
    );
    assert.true(name.get('hasDirtyAttributes'), 'Fragment itself is dirty');

    // Test fragment array item dirty state propagation
    name.set('first', 'John'); // Reset
    name._originalAttributes = { ...name._attributes };
    assert.false(person.get('hasDirtyAttributes'), 'Model clean after reset');

    addresses[0].set('street', '456 Oak Ave');
    assert.true(
      person.get('hasDirtyAttributes'),
      'Model dirty when fragment array item changes',
    );
    assert.true(
      addresses[0].get('hasDirtyAttributes'),
      'Fragment array item is dirty',
    );

    // Test fragment array structure change
    addresses[0].set('street', '123 Main St'); // Reset
    addresses[0]._originalAttributes = { ...addresses[0]._attributes };
    assert.false(person.get('hasDirtyAttributes'), 'Model clean after reset');

    addresses.createFragment({ street: '789 New St', city: 'New City' });
    assert.true(
      person.get('hasDirtyAttributes'),
      'Model dirty when fragment added to array',
    );

    // Test primitive array change
    addresses.removeAt(1); // Reset array
    addresses._originalContent = addresses.slice();
    assert.false(person.get('hasDirtyAttributes'), 'Model clean after reset');

    tags.pushObject('manager');
    assert.true(
      person.get('hasDirtyAttributes'),
      'Model dirty when primitive array changes',
    );
  });

  test('model rollback cascades to fragments', function (assert) {
    const store = this.owner.lookup('service:store');

    const person = store.createRecord('person', {
      firstName: 'Original',
      name: { first: 'Original', last: 'Person' },
      addresses: [
        { street: '123 Original St', city: 'Original City' },
        { street: '456 Second St', city: 'Second City' },
      ],
      tags: ['tag1', 'tag2'],
    });

    // Simulate clean state
    const name = person.get('name');
    const addresses = person.get('addresses');
    const tags = person.get('tags');

    name._originalAttributes = { ...name._attributes };
    addresses._originalContent = addresses.slice();
    addresses.forEach(
      (addr) => (addr._originalAttributes = { ...addr._attributes }),
    );
    tags._originalContent = tags.slice();

    // Make various changes
    person.set('firstName', 'Changed');
    name.set('first', 'Changed');
    name.set('last', 'Changed');
    addresses[0].set('street', 'Changed Street');
    addresses[1].set('city', 'Changed City');
    addresses.createFragment({ street: 'New Street', city: 'New City' });
    tags.pushObject('new-tag');
    tags[0] = 'changed-tag1';

    // Verify changes were made
    assert.strictEqual(
      person.get('firstName'),
      'Changed',
      'Regular attribute changed',
    );
    assert.strictEqual(
      name.get('first'),
      'Changed',
      'Fragment attribute changed',
    );
    assert.strictEqual(
      addresses[0].get('street'),
      'Changed Street',
      'Fragment array item changed',
    );
    assert.strictEqual(addresses.length, 3, 'Fragment array length changed');
    assert.strictEqual(tags.length, 3, 'Primitive array length changed');
    assert.true(person.get('hasDirtyAttributes'), 'Model is dirty');

    // Rollback everything
    person.rollbackAttributes();

    // Verify rollback worked
    assert.strictEqual(
      person.get('firstName'),
      'Original',
      'Regular attribute rolled back',
    );
    assert.strictEqual(
      name.get('first'),
      'Original',
      'Fragment attribute rolled back',
    );
    assert.strictEqual(
      name.get('last'),
      'Person',
      'Fragment attribute rolled back',
    );
    assert.strictEqual(
      addresses[0].get('street'),
      '123 Original St',
      'Fragment array item rolled back',
    );
    assert.strictEqual(
      addresses[1].get('city'),
      'Second City',
      'Fragment array item rolled back',
    );
    assert.strictEqual(
      addresses.length,
      2,
      'Fragment array length rolled back',
    );
    assert.strictEqual(tags.length, 2, 'Primitive array length rolled back');
    assert.strictEqual(tags[0], 'tag1', 'Primitive array content rolled back');
    assert.false(
      person.get('hasDirtyAttributes'),
      'Model is clean after rollback',
    );
    assert.false(
      name.get('hasDirtyAttributes'),
      'Fragment is clean after rollback',
    );
    assert.false(
      addresses[0].get('hasDirtyAttributes'),
      'Fragment array items clean after rollback',
    );
  });

  test('model save includes fragment data', async function (assert) {
    const store = this.owner.lookup('service:store');

    const person = store.createRecord('person', {
      firstName: 'Save',
      name: { first: 'Save', last: 'Test' },
      addresses: [
        { street: '123 Save St', city: 'Save City', state: 'SV', zip: '12345' },
      ],
      tags: ['save', 'test'],
    });

    // Test that save includes fragment data
    const savedPerson = await person.save();

    assert.ok(savedPerson, 'Save completed successfully');
    assert.strictEqual(savedPerson.get('id'), '1', 'ID was assigned');
    assert.false(
      savedPerson.get('hasDirtyAttributes'),
      'Model is clean after save',
    );

    // Verify fragment data is still accessible
    const name = savedPerson.get('name');
    const addresses = savedPerson.get('addresses');
    const tags = savedPerson.get('tags');

    assert.ok(name, 'Name fragment still exists after save');
    assert.strictEqual(name.get('first'), 'Save', 'Fragment data preserved');
    assert.strictEqual(addresses.length, 1, 'Fragment array preserved');
    assert.strictEqual(
      addresses[0].get('street'),
      '123 Save St',
      'Fragment array data preserved',
    );
    assert.strictEqual(tags.length, 2, 'Primitive array preserved');
    assert.strictEqual(tags[0], 'save', 'Primitive array data preserved');
  });

  test('model save updates fragment original content', async function (assert) {
    const store = this.owner.lookup('service:store');

    const person = store.createRecord('person', {
      firstName: 'Test',
      name: { first: 'Original', last: 'Person' },
      addresses: [{ street: 'Original St', city: 'Original City' }],
      tags: ['original'],
    });

    // Save to establish clean state
    await person.save();

    const name = person.get('name');
    const addresses = person.get('addresses');
    const tags = person.get('tags');

    // Make changes
    name.set('first', 'Updated');
    addresses[0].set('street', 'Updated St');
    tags.pushObject('updated');

    assert.true(
      person.get('hasDirtyAttributes'),
      'Model is dirty after changes',
    );
    assert.true(
      name.get('hasDirtyAttributes'),
      'Fragment is dirty after changes',
    );
    assert.true(
      addresses[0].get('hasDirtyAttributes'),
      'Fragment array item is dirty after changes',
    );
    assert.true(
      tags.get('hasDirtyAttributes'),
      'Primitive array is dirty after changes',
    );

    // Save again
    await person.save();

    // After save, fragments should be clean with updated original content
    assert.false(person.get('hasDirtyAttributes'), 'Model is clean after save');
    assert.false(
      name.get('hasDirtyAttributes'),
      'Fragment is clean after save',
    );
    assert.false(
      addresses[0].get('hasDirtyAttributes'),
      'Fragment array item is clean after save',
    );
    assert.false(
      tags.get('hasDirtyAttributes'),
      'Primitive array is clean after save',
    );

    // Verify the "new original" content is correct
    name.set('first', 'Changed Again');
    name.rollbackAttributes();
    assert.strictEqual(
      name.get('first'),
      'Updated',
      'Fragment rollback uses updated original content',
    );
  });

  test('model reload updates fragment data correctly', async function (assert) {
    const store = this.owner.lookup('service:store');

    // First, push initial data
    store.push({
      data: {
        type: 'person',
        id: '1',
        attributes: {
          firstName: 'Initial',
          name: { first: 'Initial', last: 'Person' },
          addresses: [{ street: '123 Initial St', city: 'Initial City' }],
          tags: ['initial'],
        },
      },
    });

    const person = store.peekRecord('person', '1');
    const originalName = person.get('name');
    const originalAddresses = person.get('addresses');
    const originalTags = person.get('tags');

    // Verify initial data
    assert.strictEqual(
      person.get('firstName'),
      'Initial',
      'Initial regular attribute correct',
    );
    assert.strictEqual(
      originalName.get('first'),
      'Initial',
      'Initial fragment data correct',
    );
    assert.strictEqual(
      originalAddresses.length,
      1,
      'Initial fragment array length correct',
    );
    assert.strictEqual(
      originalAddresses[0].get('street'),
      '123 Initial St',
      'Initial fragment array data correct',
    );
    assert.strictEqual(
      originalTags.length,
      1,
      'Initial primitive array length correct',
    );

    // Make some local changes to test that reload overwrites them
    person.set('firstName', 'Local Change');
    originalName.set('first', 'Local Change');
    originalAddresses[0].set('street', 'Local Change St');
    originalTags.pushObject('local');

    // Reload (adapter will return different data - see adapter mock above)
    const reloadedPerson = await person.reload();

    assert.strictEqual(reloadedPerson, person, 'Same instance returned');
    assert.strictEqual(
      person.get('firstName'),
      'Reloaded',
      'Regular attribute updated by reload',
    );

    // Test fragment data was updated
    const reloadedName = person.get('name');
    assert.strictEqual(
      reloadedName.get('first'),
      'Reloaded',
      'Fragment data updated by reload',
    );
    assert.strictEqual(
      reloadedName.get('last'),
      'Person',
      'Fragment data updated by reload',
    );

    // Test fragment array was updated
    const reloadedAddresses = person.get('addresses');
    assert.strictEqual(
      reloadedAddresses.length,
      1,
      'Fragment array length updated by reload',
    );
    assert.strictEqual(
      reloadedAddresses[0].get('street'),
      '999 Reload St',
      'Fragment array data updated by reload',
    );
    assert.strictEqual(
      reloadedAddresses[0].get('city'),
      'Reload City',
      'Fragment array data updated by reload',
    );

    // Test primitive array was updated
    const reloadedTags = person.get('tags');
    assert.strictEqual(
      reloadedTags.length,
      2,
      'Primitive array length updated by reload',
    );
    assert.strictEqual(
      reloadedTags[0],
      'reloaded',
      'Primitive array data updated by reload',
    );
    assert.strictEqual(
      reloadedTags[1],
      'test',
      'Primitive array data updated by reload',
    );

    // After reload, everything should be clean
    assert.false(
      person.get('hasDirtyAttributes'),
      'Model is clean after reload',
    );
  });

  test('save failure allows proper rollback', async function (assert) {
    const store = this.owner.lookup('service:store');

    // Override adapter to simulate save failure
    this.owner.register(
      'adapter:application',
      class FailingAdapter extends Model.Adapter {
        updateRecord() {
          return Promise.reject(new Error('Save failed'));
        }
        createRecord() {
          return Promise.reject(new Error('Save failed'));
        }
      },
    );

    const person = store.createRecord('person', {
      firstName: 'Test',
      name: { first: 'Original', last: 'Person' },
      addresses: [{ street: 'Original St', city: 'Original City' }],
      tags: ['original'],
    });

    // Simulate clean state (as if previously saved)
    const name = person.get('name');
    const addresses = person.get('addresses');
    const tags = person.get('tags');

    name._originalAttributes = { ...name._attributes };
    addresses._originalContent = addresses.slice();
    addresses.forEach(
      (addr) => (addr._originalAttributes = { ...addr._attributes }),
    );
    tags._originalContent = tags.slice();

    // Make changes
    person.set('firstName', 'Changed');
    name.set('first', 'Changed');
    addresses[0].set('street', 'Changed St');
    tags.pushObject('changed');

    assert.true(
      person.get('hasDirtyAttributes'),
      'Model is dirty before failed save',
    );

    // Try to save (should fail)
    try {
      await person.save();
      assert.ok(false, 'Save should have failed');
    } catch (error) {
      assert.strictEqual(
        error.message,
        'Save failed',
        'Save failed as expected',
      );
    }

    // After failed save, model should still be dirty
    assert.true(
      person.get('hasDirtyAttributes'),
      'Model remains dirty after failed save',
    );
    assert.strictEqual(
      person.get('firstName'),
      'Changed',
      'Regular attribute unchanged after failed save',
    );
    assert.strictEqual(
      name.get('first'),
      'Changed',
      'Fragment unchanged after failed save',
    );
    assert.strictEqual(
      addresses[0].get('street'),
      'Changed St',
      'Fragment array unchanged after failed save',
    );
    assert.strictEqual(
      tags.length,
      2,
      'Primitive array unchanged after failed save',
    );

    // Rollback should still work properly
    person.rollbackAttributes();

    assert.false(
      person.get('hasDirtyAttributes'),
      'Model clean after rollback',
    );
    assert.strictEqual(
      person.get('firstName'),
      'Test',
      'Regular attribute rolled back',
    );
    assert.strictEqual(name.get('first'), 'Original', 'Fragment rolled back');
    assert.strictEqual(
      addresses[0].get('street'),
      'Original St',
      'Fragment array rolled back',
    );
    assert.strictEqual(tags.length, 1, 'Primitive array rolled back');
  });

  test('complex nested fragment lifecycle', async function (assert) {
    const store = this.owner.lookup('service:store');

    const person = store.createRecord('person', {
      firstName: 'Complex',
      name: { first: 'Complex', last: 'User' },
      orders: [
        {
          orderNumber: 'ORD-001',
          total: 299.98,
          products: [
            { name: 'Widget A', sku: 'WID-A-01', price: 149.99 },
            { name: 'Widget B', sku: 'WID-B-01', price: 149.99 },
          ],
        },
        {
          orderNumber: 'ORD-002',
          total: 99.99,
          products: [{ name: 'Gadget C', sku: 'GAD-C-01', price: 99.99 }],
        },
      ],
    });

    const orders = person.get('orders');
    const firstOrder = orders[0];
    const products = firstOrder.get('products');
    const firstProduct = products[0];

    // Test deeply nested structure
    assert.strictEqual(orders.length, 2, 'Two orders created');
    assert.strictEqual(
      firstOrder.get('orderNumber'),
      'ORD-001',
      'Order data correct',
    );
    assert.strictEqual(products.length, 2, 'Two products in first order');
    assert.strictEqual(
      firstProduct.get('name'),
      'Widget A',
      'Product data correct',
    );

    // Simulate clean state
    const name = person.get('name');
    name._originalAttributes = { ...name._attributes };
    orders._originalContent = orders.slice();
    orders.forEach((order) => {
      order._originalAttributes = { ...order._attributes };
      const orderProducts = order.get('products');
      orderProducts._originalContent = orderProducts.slice();
      orderProducts.forEach((product) => {
        product._originalAttributes = { ...product._attributes };
      });
    });

    assert.false(
      person.get('hasDirtyAttributes'),
      'Complex structure starts clean',
    );

    // Make nested changes
    firstProduct.set('price', 199.99);
    assert.true(
      person.get('hasDirtyAttributes'),
      'Model dirty when deeply nested fragment changes',
    );
    assert.true(
      firstProduct.get('hasDirtyAttributes'),
      'Deeply nested fragment is dirty',
    );

    // Add new product to nested array
    products.createFragment({
      name: 'Widget D',
      sku: 'WID-D-01',
      price: 79.99,
    });
    assert.strictEqual(products.length, 3, 'Product added to nested array');
    assert.true(
      person.get('hasDirtyAttributes'),
      'Model dirty after nested array change',
    );

    // Rollback should cascade to all levels
    person.rollbackAttributes();

    assert.false(
      person.get('hasDirtyAttributes'),
      'Model clean after rollback',
    );
    assert.strictEqual(
      firstProduct.get('price'),
      149.99,
      'Deeply nested fragment rolled back',
    );
    assert.strictEqual(products.length, 2, 'Nested array length rolled back');
    assert.false(
      firstProduct.get('hasDirtyAttributes'),
      'Deeply nested fragment clean after rollback',
    );
  });

  test('fragment identity maintained through lifecycle', function (assert) {
    const store = this.owner.lookup('service:store');

    const person = store.createRecord('person', {
      firstName: 'Identity',
      name: { first: 'Identity', last: 'Test' },
      addresses: [{ street: '123 Identity St', city: 'Identity City' }],
    });

    const originalName = person.get('name');
    const originalAddresses = person.get('addresses');
    const originalFirstAddress = originalAddresses[0];

    // Make changes
    originalName.set('first', 'Changed');
    originalFirstAddress.set('street', 'Changed St');

    // Rollback
    person.rollbackAttributes();

    // Test that we still have the same fragment instances
    const nameAfterRollback = person.get('name');
    const addressesAfterRollback = person.get('addresses');
    const firstAddressAfterRollback = addressesAfterRollback[0];

    assert.strictEqual(
      nameAfterRollback,
      originalName,
      'Same fragment instance after rollback',
    );
    assert.strictEqual(
      addressesAfterRollback,
      originalAddresses,
      'Same fragment array instance after rollback',
    );
    assert.strictEqual(
      firstAddressAfterRollback,
      originalFirstAddress,
      'Same fragment array item instance after rollback',
    );

    // Test that data was rolled back
    assert.strictEqual(
      nameAfterRollback.get('first'),
      'Identity',
      'Fragment data rolled back',
    );
    assert.strictEqual(
      firstAddressAfterRollback.get('street'),
      '123 Identity St',
      'Fragment array item data rolled back',
    );
  });

  test('changedAttributes includes fragment changes', function (assert) {
    const store = this.owner.lookup('service:store');

    const person = store.createRecord('person', {
      firstName: 'Test',
      name: { first: 'Original', last: 'Person' },
      addresses: [{ street: 'Original St', city: 'Original City' }],
      tags: ['original'],
    });

    // Simulate clean state
    const name = person.get('name');
    const addresses = person.get('addresses');
    const tags = person.get('tags');

    name._originalAttributes = { ...name._attributes };
    addresses._originalContent = addresses.slice();
    addresses.forEach(
      (addr) => (addr._originalAttributes = { ...addr._attributes }),
    );
    tags._originalContent = tags.slice();

    // Make changes
    person.set('firstName', 'Changed');
    name.set('first', 'Changed');
    addresses[0].set('street', 'Changed St');
    tags.pushObject('changed');

    const changes = person.get('changedAttributes');

    assert.ok(changes.firstName, 'Regular attribute change included');
    assert.ok(changes.name, 'Fragment changes included');
    assert.ok(changes.addresses, 'Fragment array changes included');
    assert.ok(changes.tags, 'Primitive array changes included');
  });
});
