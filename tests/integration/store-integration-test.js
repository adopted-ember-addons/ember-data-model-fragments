import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Model, { attr } from '@ember-data/model';
import Fragment from 'ember-data-model-fragments/fragment';
import {
  fragment,
  fragmentArray,
  array,
} from 'ember-data-model-fragments/attributes';

// Import our initializer to manually setup fragments in tests
import fragmentInitializer from 'ember-data-model-fragments/initializers/fragment-transforms';

module('Integration | Store Integration', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    // Manually initialize fragment transforms for integration tests
    // This is required because integration tests don't automatically run initializers
    fragmentInitializer.initialize(this.owner);

    // Define test fragment models
    class NameFragment extends Fragment {
      static modelName = 'name';
      @attr('string') first;
      @attr('string') last;
    }

    class AddressFragment extends Fragment {
      static modelName = 'address';
      @attr('string') street;
      @attr('string') city;
      @attr('string') state;
      @attr('string') zip;
    }

    class PhoneFragment extends Fragment {
      static modelName = 'phone';
      @attr('string') type;
      @attr('string') number;
    }

    // Define test models
    class PersonModel extends Model {
      @attr('string') firstName;
      @fragment('name') name;
      @fragmentArray('address') addresses;
      @array('string') tags;
      @fragment('name', {
        defaultValue: { first: 'Default', last: 'Person' },
      })
      defaultName;
    }

    class CompanyModel extends Model {
      @attr('string') companyName;
      @fragmentArray('address') locations;
      @fragmentArray('phone') phoneNumbers;
    }

    // Register models with test container
    this.owner.register('model:name', NameFragment);
    this.owner.register('model:address', AddressFragment);
    this.owner.register('model:phone', PhoneFragment);
    this.owner.register('model:person', PersonModel);
    this.owner.register('model:company', CompanyModel);
  });

  test('store has createFragment method', function (assert) {
    const store = this.owner.lookup('service:store');

    assert.ok(
      typeof store.createFragment === 'function',
      'Store has createFragment method',
    );
  });

  test('store.createFragment creates fragment instances', function (assert) {
    const store = this.owner.lookup('service:store');

    const nameFragment = store.createFragment('name', {
      first: 'John',
      last: 'Doe',
    });

    assert.ok(nameFragment, 'Fragment was created');
    assert.strictEqual(
      nameFragment.get('first'),
      'John',
      'Fragment has correct first name',
    );
    assert.strictEqual(
      nameFragment.get('last'),
      'Doe',
      'Fragment has correct last name',
    );
    assert.strictEqual(
      nameFragment.constructor.modelName,
      'name',
      'Fragment has correct modelName',
    );
  });

  test('store.createFragment with no data creates empty fragment', function (assert) {
    const store = this.owner.lookup('service:store');

    const nameFragment = store.createFragment('name');

    assert.ok(nameFragment, 'Fragment was created');
    assert.strictEqual(
      nameFragment.get('first'),
      undefined,
      'Fragment has no first name',
    );
    assert.strictEqual(
      nameFragment.get('last'),
      undefined,
      'Fragment has no last name',
    );
  });

  test('store.createFragment throws error for unknown fragment type', function (assert) {
    const store = this.owner.lookup('service:store');

    assert.throws(
      () => {
        store.createFragment('nonexistent', { data: 'test' });
      },
      /Could not find fragment class for type: nonexistent/,
      'Throws helpful error for missing fragment type',
    );
  });

  test('store.createRecord with fragment data creates fragments via transforms', function (assert) {
    const store = this.owner.lookup('service:store');

    const person = store.createRecord('person', {
      firstName: 'Jane',
      name: {
        first: 'Jane',
        last: 'Smith',
      },
      addresses: [
        {
          street: '123 Main St',
          city: 'Anytown',
          state: 'NY',
          zip: '12345',
        },
      ],
      tags: ['developer', 'ember'],
    });

    assert.ok(person, 'Person record was created');
    assert.strictEqual(
      person.get('firstName'),
      'Jane',
      'Regular attribute set correctly',
    );

    // Test fragment attribute
    const name = person.get('name');
    assert.ok(name, 'Name fragment exists');
    assert.strictEqual(
      name.get('first'),
      'Jane',
      'Fragment first name correct',
    );
    assert.strictEqual(name.get('last'), 'Smith', 'Fragment last name correct');
    assert.ok(
      name.constructor.name.includes('Fragment'),
      'Name is a fragment instance',
    );

    // Test fragment array attribute
    const addresses = person.get('addresses');
    assert.ok(addresses, 'Addresses array exists');
    assert.strictEqual(
      addresses.length,
      1,
      'Addresses array has correct length',
    );

    const address = addresses[0];
    assert.ok(address, 'First address exists');
    assert.strictEqual(
      address.get('street'),
      '123 Main St',
      'Address street correct',
    );
    assert.strictEqual(address.get('city'), 'Anytown', 'Address city correct');
    assert.ok(
      address.constructor.name.includes('Fragment'),
      'Address is a fragment instance',
    );

    // Test primitive array attribute
    const tags = person.get('tags');
    assert.ok(tags, 'Tags array exists');
    assert.strictEqual(tags.length, 2, 'Tags array has correct length');
    assert.strictEqual(tags[0], 'developer', 'First tag correct');
    assert.strictEqual(tags[1], 'ember', 'Second tag correct');
  });

  test('store.createRecord with empty fragment data uses defaults', function (assert) {
    const store = this.owner.lookup('service:store');

    const person = store.createRecord('person', {
      firstName: 'Test',
    });

    // Test default fragment value
    const defaultName = person.get('defaultName');
    assert.ok(defaultName, 'Default name fragment exists');
    assert.strictEqual(
      defaultName.get('first'),
      'Default',
      'Default first name used',
    );
    assert.strictEqual(
      defaultName.get('last'),
      'Person',
      'Default last name used',
    );

    // Test that regular fragment is null when no data provided
    const name = person.get('name');
    assert.strictEqual(
      name,
      null,
      'Regular fragment is null when no data provided',
    );

    // Test that fragment array is empty array when no data provided
    const addresses = person.get('addresses');
    assert.ok(addresses, 'Fragment array exists');
    assert.strictEqual(
      addresses.length,
      0,
      'Fragment array is empty when no data provided',
    );

    // Test that primitive array is empty when no data provided
    const tags = person.get('tags');
    assert.ok(tags, 'Primitive array exists');
    assert.strictEqual(
      tags.length,
      0,
      'Primitive array is empty when no data provided',
    );
  });

  test('fragment arrays support createFragment method', function (assert) {
    const store = this.owner.lookup('service:store');

    const person = store.createRecord('person', { firstName: 'Test' });
    const addresses = person.get('addresses');

    // Test createFragment method on fragment array
    const newAddress = addresses.createFragment({
      street: '456 Oak Ave',
      city: 'Somewhere',
      state: 'CA',
      zip: '67890',
    });

    assert.ok(newAddress, 'New address fragment created');
    assert.strictEqual(
      newAddress.get('street'),
      '456 Oak Ave',
      'New address has correct data',
    );
    assert.strictEqual(addresses.length, 1, 'Fragment array length increased');
    assert.strictEqual(addresses[0], newAddress, 'New fragment added to array');
    assert.ok(
      newAddress.constructor.name.includes('Fragment'),
      'Created item is a fragment',
    );
  });

  test('models with fragments have hasFragmentAttributes method', function (assert) {
    const store = this.owner.lookup('service:store');

    const person = store.createRecord('person', { firstName: 'Test' });

    assert.ok(
      typeof person.hasFragmentAttributes === 'function',
      'Model has hasFragmentAttributes method',
    );
    assert.true(
      person.hasFragmentAttributes(),
      'Person model has fragment attributes',
    );
  });

  test('store.findRecord loads fragment data correctly', async function (assert) {
    const store = this.owner.lookup('service:store');

    // Push data into the store to simulate a findRecord response
    store.push({
      data: {
        type: 'person',
        id: '1',
        attributes: {
          firstName: 'John',
          name: {
            first: 'John',
            last: 'Doe',
          },
          addresses: [
            {
              street: '789 Pine St',
              city: 'Testville',
              state: 'TX',
              zip: '54321',
            },
            {
              street: '321 Elm St',
              city: 'Anotherville',
              state: 'FL',
              zip: '98765',
            },
          ],
          tags: ['manager', 'lead'],
        },
      },
    });

    const person = store.peekRecord('person', '1');

    assert.ok(person, 'Person record exists in store');
    assert.strictEqual(
      person.get('firstName'),
      'John',
      'Regular attribute loaded correctly',
    );

    // Test fragment loading
    const name = person.get('name');
    assert.ok(name, 'Name fragment loaded');
    assert.strictEqual(name.get('first'), 'John', 'Fragment first name loaded');
    assert.strictEqual(name.get('last'), 'Doe', 'Fragment last name loaded');

    // Test fragment array loading
    const addresses = person.get('addresses');
    assert.ok(addresses, 'Addresses loaded');
    assert.strictEqual(addresses.length, 2, 'Multiple addresses loaded');

    const firstAddress = addresses[0];
    assert.strictEqual(
      firstAddress.get('street'),
      '789 Pine St',
      'First address loaded correctly',
    );

    const secondAddress = addresses[1];
    assert.strictEqual(
      secondAddress.get('street'),
      '321 Elm St',
      'Second address loaded correctly',
    );

    // Test primitive array loading
    const tags = person.get('tags');
    assert.ok(tags, 'Tags loaded');
    assert.strictEqual(tags.length, 2, 'Multiple tags loaded');
    assert.strictEqual(tags[0], 'manager', 'First tag loaded correctly');
    assert.strictEqual(tags[1], 'lead', 'Second tag loaded correctly');
  });

  test('nested fragment arrays work correctly', function (assert) {
    const store = this.owner.lookup('service:store');

    const company = store.createRecord('company', {
      companyName: 'Test Corp',
      locations: [
        {
          street: '100 Business Ave',
          city: 'Corporate City',
          state: 'NY',
          zip: '10001',
        },
      ],
      phoneNumbers: [
        {
          type: 'main',
          number: '555-0123',
        },
        {
          type: 'fax',
          number: '555-0124',
        },
      ],
    });

    assert.ok(company, 'Company record created');
    assert.strictEqual(
      company.get('companyName'),
      'Test Corp',
      'Company name set correctly',
    );

    // Test multiple fragment arrays on same model
    const locations = company.get('locations');
    const phoneNumbers = company.get('phoneNumbers');

    assert.ok(locations, 'Locations array exists');
    assert.strictEqual(
      locations.length,
      1,
      'Locations array has correct length',
    );
    assert.strictEqual(
      locations[0].get('street'),
      '100 Business Ave',
      'Location data correct',
    );

    assert.ok(phoneNumbers, 'Phone numbers array exists');
    assert.strictEqual(
      phoneNumbers.length,
      2,
      'Phone numbers array has correct length',
    );
    assert.strictEqual(
      phoneNumbers[0].get('type'),
      'main',
      'First phone type correct',
    );
    assert.strictEqual(
      phoneNumbers[1].get('number'),
      '555-0124',
      'Second phone number correct',
    );

    // Test adding to both arrays
    const newLocation = locations.createFragment({
      street: '200 Branch St',
      city: 'Branch City',
      state: 'CA',
      zip: '90210',
    });

    const newPhone = phoneNumbers.createFragment({
      type: 'mobile',
      number: '555-0125',
    });

    assert.strictEqual(locations.length, 2, 'Locations array expanded');
    assert.strictEqual(phoneNumbers.length, 3, 'Phone numbers array expanded');
    assert.strictEqual(
      newLocation.get('city'),
      'Branch City',
      'New location added correctly',
    );
    assert.strictEqual(
      newPhone.get('type'),
      'mobile',
      'New phone added correctly',
    );
  });

  test('fragment arrays maintain ember array compatibility', function (assert) {
    const store = this.owner.lookup('service:store');

    const person = store.createRecord('person', {
      firstName: 'Test',
      addresses: [
        { street: '123 First St', city: 'City1' },
        { street: '456 Second St', city: 'City2' },
      ],
    });

    const addresses = person.get('addresses');

    // Test Ember Array methods
    assert.strictEqual(
      addresses.get('firstObject').get('street'),
      '123 First St',
      'firstObject works',
    );
    assert.strictEqual(
      addresses.get('lastObject').get('street'),
      '456 Second St',
      'lastObject works',
    );
    assert.strictEqual(
      addresses.objectAt(1).get('city'),
      'City2',
      'objectAt works',
    );

    // Test array mutation methods
    addresses.pushObject(
      store.createFragment('address', {
        street: '789 Third St',
        city: 'City3',
      }),
    );

    assert.strictEqual(addresses.length, 3, 'pushObject works');
    assert.strictEqual(
      addresses.get('lastObject').get('street'),
      '789 Third St',
      'New object added correctly',
    );

    // Test removeObject
    const secondAddress = addresses.objectAt(1);
    addresses.removeObject(secondAddress);

    assert.strictEqual(addresses.length, 2, 'removeObject works');
    assert.strictEqual(
      addresses.objectAt(1).get('street'),
      '789 Third St',
      'Correct object removed',
    );
  });

  test('primitive arrays work with type coercion', function (assert) {
    const store = this.owner.lookup('service:store');

    // Create a model class that uses typed primitive arrays
    class TestModel extends Model {
      @array('string') stringArray;
      @array('number') numberArray;
      @array('boolean') booleanArray;
    }

    this.owner.register('model:test-model', TestModel);

    const record = store.createRecord('test-model', {
      stringArray: [1, 2, 3], // Numbers should be coerced to strings
      numberArray: ['1', '2', '3'], // Strings should be coerced to numbers
      booleanArray: [1, 0, 'true', ''], // Various values should be coerced to booleans
    });

    const stringArray = record.get('stringArray');
    const numberArray = record.get('numberArray');
    const booleanArray = record.get('booleanArray');

    // Test string coercion
    assert.deepEqual(
      stringArray.slice(),
      ['1', '2', '3'],
      'Numbers coerced to strings',
    );

    // Test number coercion
    assert.deepEqual(
      numberArray.slice(),
      [1, 2, 3],
      'Strings coerced to numbers',
    );

    // Test boolean coercion
    assert.deepEqual(
      booleanArray.slice(),
      [true, false, true, false],
      'Values coerced to booleans',
    );
  });

  test('store integration works with complex nested data', function (assert) {
    const store = this.owner.lookup('service:store');

    // Create a complex nested structure
    const person = store.createRecord('person', {
      firstName: 'Complex',
      name: {
        first: 'Complex',
        last: 'User',
      },
      addresses: [
        {
          street: '123 Nested St',
          city: 'Nested City',
          state: 'NS',
          zip: '12345',
        },
      ],
      tags: ['complex', 'nested', 'test'],
    });

    // Test that all nested data is accessible
    assert.strictEqual(
      person.get('name.first'),
      'Complex',
      'Nested fragment property accessible',
    );
    assert.strictEqual(
      person.get('addresses.firstObject.street'),
      '123 Nested St',
      'Nested fragment array property accessible',
    );
    assert.strictEqual(
      person.get('tags.firstObject'),
      'complex',
      'Primitive array property accessible',
    );

    // Test that changes propagate correctly
    person.get('name').set('first', 'Changed');
    person.get('addresses').get('firstObject').set('city', 'Changed City');
    person.get('tags').pushObject('new-tag');

    assert.strictEqual(
      person.get('name.first'),
      'Changed',
      'Fragment change reflected',
    );
    assert.strictEqual(
      person.get('addresses.firstObject.city'),
      'Changed City',
      'Fragment array item change reflected',
    );
    assert.strictEqual(
      person.get('tags.length'),
      4,
      'Primitive array change reflected',
    );
    assert.strictEqual(
      person.get('tags.lastObject'),
      'new-tag',
      'New primitive array item accessible',
    );
  });
});
