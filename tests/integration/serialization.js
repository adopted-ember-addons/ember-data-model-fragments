import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Model, { attr } from '@ember-data/model';
import Fragment from 'ember-data-model-fragments/fragment';
import {
  fragment,
  fragmentArray,
  array,
} from 'ember-data-model-fragments/attributes';
import JSONSerializer from '@ember-data/serializer/json';

// Import our initializer to manually setup fragments in tests
import edmfInitializer from 'ember-data-model-fragments/initializers/ember-data-model-fragments';

module('Integration | Serialization', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    // Manually initialize fragment transforms for integration tests
    edmfInitializer.initialize(this.owner);

    // Define test fragment models
    class NameFragment extends Fragment {
      static modelName = 'name';
      @attr('string') first;
      @attr('string') last;
      @attr('string') title;

      get fullName() {
        const parts = [
          this.get('title'),
          this.get('first'),
          this.get('last'),
        ].filter(Boolean);
        return parts.join(' ');
      }
    }

    class AddressFragment extends Fragment {
      static modelName = 'address';
      @attr('string') street;
      @attr('string') city;
      @attr('string') state;
      @attr('string') zip;
      @attr('string') country;
    }

    class ContactFragment extends Fragment {
      static modelName = 'contact';
      @attr('string') type; // email, phone, etc.
      @attr('string') value;
      @attr('boolean') primary;
    }

    class ProductFragment extends Fragment {
      static modelName = 'product';
      @attr('string') name;
      @attr('string') sku;
      @attr('number') price;
      @attr('string') category;
      @fragmentArray('contact') contacts; // nested fragments
    }

    class OrderFragment extends Fragment {
      static modelName = 'order';
      @attr('string') orderNumber;
      @attr('number') total;
      @attr('date') orderDate;
      @fragmentArray('product') products;
      @fragment('address') shippingAddress;
    }

    // Define test models
    class PersonModel extends Model {
      @attr('string') firstName;
      @attr('string') lastName;
      @fragment('name') fullName;
      @fragmentArray('address') addresses;
      @fragmentArray('contact') contacts;
      @array('string') tags;
      @array('number') scores;
      @fragmentArray('order') orders;
    }

    class CompanyModel extends Model {
      @attr('string') name;
      @attr('string') industry;
      @fragment('address') headquarters;
      @fragmentArray('address') offices;
      @fragmentArray('contact') contactMethods;
      @array('string') services;
    }

    // Custom serializer for testing serializer integration
    class NameSerializer extends JSONSerializer {
      attrs = {
        first: 'firstName',
        last: 'lastName',
      };

      serialize(snapshot, options) {
        const json = super.serialize(snapshot, options);
        // Add computed property to serialized output
        json.computed_full_name = snapshot.record.get('fullName');
        return json;
      }
    }

    // Custom serializer with transforms
    class ContactSerializer extends JSONSerializer {
      serialize(snapshot, options) {
        const json = super.serialize(snapshot, options);
        // Transform type to uppercase
        if (json.type) {
          json.type = json.type.toUpperCase();
        }
        return json;
      }

      normalize(typeClass, hash) {
        // Transform type back to lowercase
        if (hash.type) {
          hash.type = hash.type.toLowerCase();
        }
        return super.normalize(typeClass, hash);
      }
    }

    // Register models and serializers
    this.owner.register('model:name', NameFragment);
    this.owner.register('model:address', AddressFragment);
    this.owner.register('model:contact', ContactFragment);
    this.owner.register('model:product', ProductFragment);
    this.owner.register('model:order', OrderFragment);
    this.owner.register('model:person', PersonModel);
    this.owner.register('model:company', CompanyModel);
    this.owner.register('serializer:name', NameSerializer);
    this.owner.register('serializer:contact', ContactSerializer);
  });

  test('fragment serialization produces correct JSON structure', function (assert) {
    const store = this.owner.lookup('service:store');

    const person = store.createRecord('person', {
      firstName: 'John',
      lastName: 'Doe',
      fullName: {
        title: 'Mr.',
        first: 'John',
        last: 'Doe',
      },
      addresses: [
        {
          street: '123 Main St',
          city: 'Anytown',
          state: 'NY',
          zip: '12345',
          country: 'USA',
        },
        {
          street: '456 Oak Ave',
          city: 'Somewhere',
          state: 'CA',
          zip: '67890',
          country: 'USA',
        },
      ],
      contacts: [
        { type: 'email', value: 'john@example.com', primary: true },
        { type: 'phone', value: '555-1234', primary: false },
      ],
      tags: ['developer', 'ember', 'javascript'],
      scores: [85, 92, 78],
    });

    const serialized = person.serialize();

    // Test top-level structure
    assert.ok(serialized.data, 'Has data property');
    assert.strictEqual(serialized.data.type, 'person', 'Correct type');
    assert.ok(serialized.data.attributes, 'Has attributes');

    const attrs = serialized.data.attributes;

    // Test regular attributes
    assert.strictEqual(
      attrs.firstName,
      'John',
      'Regular string attribute serialized',
    );
    assert.strictEqual(
      attrs.lastName,
      'Doe',
      'Regular string attribute serialized',
    );

    // Test fragment serialization
    assert.ok(attrs.fullName, 'Fragment attribute present');
    assert.strictEqual(
      attrs.fullName.title,
      'Mr.',
      'Fragment nested property serialized',
    );
    assert.strictEqual(
      attrs.fullName.first,
      'John',
      'Fragment nested property serialized',
    );
    assert.strictEqual(
      attrs.fullName.last,
      'Doe',
      'Fragment nested property serialized',
    );

    // Test fragment array serialization
    assert.ok(Array.isArray(attrs.addresses), 'Fragment array is array');
    assert.strictEqual(
      attrs.addresses.length,
      2,
      'Fragment array has correct length',
    );
    assert.strictEqual(
      attrs.addresses[0].street,
      '123 Main St',
      'Fragment array item serialized',
    );
    assert.strictEqual(
      attrs.addresses[1].city,
      'Somewhere',
      'Fragment array item serialized',
    );

    assert.ok(Array.isArray(attrs.contacts), 'Fragment array is array');
    assert.strictEqual(
      attrs.contacts.length,
      2,
      'Fragment array has correct length',
    );
    assert.strictEqual(
      attrs.contacts[0].type,
      'email',
      'Fragment array item serialized',
    );
    assert.strictEqual(
      attrs.contacts[0].primary,
      true,
      'Fragment array boolean serialized',
    );

    // Test primitive arrays
    assert.deepEqual(
      attrs.tags,
      ['developer', 'ember', 'javascript'],
      'String array serialized',
    );
    assert.deepEqual(attrs.scores, [85, 92, 78], 'Number array serialized');
  });

  test('fragment deserialization creates correct structure', function (assert) {
    const store = this.owner.lookup('service:store');

    // Simulate pushing data from server
    const serverData = {
      data: {
        type: 'person',
        id: '1',
        attributes: {
          firstName: 'Jane',
          lastName: 'Smith',
          fullName: {
            title: 'Dr.',
            first: 'Jane',
            last: 'Smith',
          },
          addresses: [
            {
              street: '789 Pine St',
              city: 'Testville',
              state: 'TX',
              zip: '54321',
              country: 'USA',
            },
          ],
          contacts: [
            { type: 'email', value: 'jane@example.com', primary: true },
            { type: 'phone', value: '555-5678', primary: false },
            { type: 'fax', value: '555-5679', primary: false },
          ],
          tags: ['doctor', 'researcher'],
          scores: [95, 88, 91, 87],
        },
      },
    };

    store.push(serverData);
    const person = store.peekRecord('person', '1');

    // Test regular attributes
    assert.strictEqual(
      person.get('firstName'),
      'Jane',
      'Regular attribute deserialized',
    );
    assert.strictEqual(
      person.get('lastName'),
      'Smith',
      'Regular attribute deserialized',
    );

    // Test fragment deserialization
    const fullName = person.get('fullName');
    assert.ok(fullName, 'Fragment deserialized');
    assert.ok(
      fullName.constructor.name.includes('Fragment'),
      'Fragment is fragment instance',
    );
    assert.strictEqual(
      fullName.get('title'),
      'Dr.',
      'Fragment attribute deserialized',
    );
    assert.strictEqual(
      fullName.get('first'),
      'Jane',
      'Fragment attribute deserialized',
    );
    assert.strictEqual(
      fullName.get('last'),
      'Smith',
      'Fragment attribute deserialized',
    );

    // Test fragment array deserialization
    const addresses = person.get('addresses');
    assert.ok(addresses, 'Fragment array deserialized');
    assert.strictEqual(
      addresses.length,
      1,
      'Fragment array has correct length',
    );
    assert.ok(
      addresses.constructor.name.includes('Array'),
      'Fragment array is array instance',
    );

    const address = addresses[0];
    assert.ok(
      address.constructor.name.includes('Fragment'),
      'Fragment array item is fragment',
    );
    assert.strictEqual(
      address.get('street'),
      '789 Pine St',
      'Fragment array item deserialized',
    );
    assert.strictEqual(
      address.get('country'),
      'USA',
      'Fragment array item deserialized',
    );

    const contacts = person.get('contacts');
    assert.strictEqual(contacts.length, 3, 'Fragment array has correct length');
    assert.strictEqual(
      contacts[0].get('type'),
      'email',
      'Fragment array item deserialized',
    );
    assert.strictEqual(
      contacts[0].get('primary'),
      true,
      'Fragment array boolean deserialized',
    );
    assert.strictEqual(
      contacts[2].get('value'),
      '555-5679',
      'Fragment array item deserialized',
    );

    // Test primitive arrays
    const tags = person.get('tags');
    const scores = person.get('scores');
    assert.deepEqual(
      tags.slice(),
      ['doctor', 'researcher'],
      'String array deserialized',
    );
    assert.deepEqual(
      scores.slice(),
      [95, 88, 91, 87],
      'Number array deserialized',
    );
  });

  test('serialization round-trip maintains data integrity', function (assert) {
    const store = this.owner.lookup('service:store');

    const originalData = {
      firstName: 'Round',
      lastName: 'Trip',
      fullName: {
        title: 'Ms.',
        first: 'Round',
        last: 'Trip',
      },
      addresses: [
        {
          street: '123 Round St',
          city: 'Trip City',
          state: 'RT',
          zip: '12345',
          country: 'USA',
        },
        {
          street: '456 Circle Ave',
          city: 'Loop Town',
          state: 'LP',
          zip: '67890',
          country: 'USA',
        },
      ],
      contacts: [
        { type: 'email', value: 'round@trip.com', primary: true },
        { type: 'phone', value: '555-TRIP', primary: false },
      ],
      tags: ['round', 'trip', 'test'],
      scores: [100, 95, 90],
    };

    // Create record
    const person = store.createRecord('person', originalData);

    // Serialize
    const serialized = person.serialize();

    // Create new record from serialized data
    const recreatedPerson = store.createRecord(
      'person',
      serialized.data.attributes,
    );

    // Compare all data
    assert.strictEqual(
      recreatedPerson.get('firstName'),
      originalData.firstName,
      'Regular attribute preserved',
    );
    assert.strictEqual(
      recreatedPerson.get('lastName'),
      originalData.lastName,
      'Regular attribute preserved',
    );

    // Compare fragment
    const recreatedFullName = recreatedPerson.get('fullName');
    assert.strictEqual(
      recreatedFullName.get('title'),
      originalData.fullName.title,
      'Fragment attribute preserved',
    );
    assert.strictEqual(
      recreatedFullName.get('first'),
      originalData.fullName.first,
      'Fragment attribute preserved',
    );
    assert.strictEqual(
      recreatedFullName.get('last'),
      originalData.fullName.last,
      'Fragment attribute preserved',
    );

    // Compare fragment arrays
    const recreatedAddresses = recreatedPerson.get('addresses');
    assert.strictEqual(
      recreatedAddresses.length,
      originalData.addresses.length,
      'Fragment array length preserved',
    );
    assert.strictEqual(
      recreatedAddresses[0].get('street'),
      originalData.addresses[0].street,
      'Fragment array item preserved',
    );
    assert.strictEqual(
      recreatedAddresses[1].get('city'),
      originalData.addresses[1].city,
      'Fragment array item preserved',
    );

    const recreatedContacts = recreatedPerson.get('contacts');
    assert.strictEqual(
      recreatedContacts.length,
      originalData.contacts.length,
      'Fragment array length preserved',
    );
    assert.strictEqual(
      recreatedContacts[0].get('value'),
      originalData.contacts[0].value,
      'Fragment array item preserved',
    );
    assert.strictEqual(
      recreatedContacts[1].get('primary'),
      originalData.contacts[1].primary,
      'Fragment array boolean preserved',
    );

    // Compare primitive arrays
    const recreatedTags = recreatedPerson.get('tags');
    const recreatedScores = recreatedPerson.get('scores');
    assert.deepEqual(
      recreatedTags.slice(),
      originalData.tags,
      'String array preserved',
    );
    assert.deepEqual(
      recreatedScores.slice(),
      originalData.scores,
      'Number array preserved',
    );
  });

  test('nested fragment serialization works correctly', function (assert) {
    const store = this.owner.lookup('service:store');

    const person = store.createRecord('person', {
      firstName: 'Nested',
      lastName: 'Test',
      orders: [
        {
          orderNumber: 'ORD-001',
          total: 299.98,
          orderDate: new Date('2023-01-15'),
          shippingAddress: {
            street: '123 Ship St',
            city: 'Ship City',
            state: 'SC',
            zip: '12345',
            country: 'USA',
          },
          products: [
            {
              name: 'Widget A',
              sku: 'WID-A-01',
              price: 149.99,
              category: 'widgets',
              contacts: [
                { type: 'support', value: 'support@widget.com', primary: true },
              ],
            },
            {
              name: 'Gadget B',
              sku: 'GAD-B-01',
              price: 149.99,
              category: 'gadgets',
              contacts: [
                { type: 'sales', value: 'sales@gadget.com', primary: true },
                { type: 'phone', value: '555-GADGET', primary: false },
              ],
            },
          ],
        },
      ],
    });

    const serialized = person.serialize();
    const attrs = serialized.data.attributes;

    // Test nested structure
    assert.ok(attrs.orders, 'Orders array present');
    assert.strictEqual(attrs.orders.length, 1, 'Orders array length correct');

    const order = attrs.orders[0];
    assert.strictEqual(
      order.orderNumber,
      'ORD-001',
      'Order attribute serialized',
    );
    assert.strictEqual(
      order.total,
      299.98,
      'Order number attribute serialized',
    );

    // Test nested fragment (shippingAddress)
    assert.ok(order.shippingAddress, 'Nested fragment present');
    assert.strictEqual(
      order.shippingAddress.street,
      '123 Ship St',
      'Nested fragment attribute serialized',
    );
    assert.strictEqual(
      order.shippingAddress.country,
      'USA',
      'Nested fragment attribute serialized',
    );

    // Test nested fragment array (products)
    assert.ok(Array.isArray(order.products), 'Nested fragment array is array');
    assert.strictEqual(
      order.products.length,
      2,
      'Nested fragment array length correct',
    );

    const product1 = order.products[0];
    assert.strictEqual(
      product1.name,
      'Widget A',
      'Nested fragment array item serialized',
    );
    assert.strictEqual(
      product1.price,
      149.99,
      'Nested fragment array item serialized',
    );

    // Test deeply nested fragment array (products.contacts)
    assert.ok(
      Array.isArray(product1.contacts),
      'Deeply nested fragment array is array',
    );
    assert.strictEqual(
      product1.contacts.length,
      1,
      'Deeply nested fragment array length correct',
    );
    assert.strictEqual(
      product1.contacts[0].type,
      'support',
      'Deeply nested fragment serialized',
    );

    const product2 = order.products[1];
    assert.strictEqual(
      product2.contacts.length,
      2,
      'Deeply nested fragment array length correct',
    );
    assert.strictEqual(
      product2.contacts[1].value,
      '555-GADGET',
      'Deeply nested fragment serialized',
    );
  });

  test('custom fragment serializers work correctly', function (assert) {
    const store = this.owner.lookup('service:store');

    const person = store.createRecord('person', {
      firstName: 'Custom',
      lastName: 'Serializer',
      fullName: {
        title: 'Prof.',
        first: 'Custom',
        last: 'Serializer',
      },
      contacts: [
        { type: 'email', value: 'custom@serializer.com', primary: true },
        { type: 'phone', value: '555-CUSTOM', primary: false },
      ],
    });

    const serialized = person.serialize();
    const attrs = serialized.data.attributes;

    // Test custom name serializer (attrs mapping and computed property)
    assert.ok(attrs.fullName, 'Fragment with custom serializer present');
    assert.strictEqual(
      attrs.fullName.firstName,
      'Custom',
      'Custom serializer attrs mapping works',
    );
    assert.strictEqual(
      attrs.fullName.lastName,
      'Serializer',
      'Custom serializer attrs mapping works',
    );
    assert.strictEqual(
      attrs.fullName.computed_full_name,
      'Prof. Custom Serializer',
      'Custom serializer computed property works',
    );

    // Test custom contact serializer (type transformation)
    assert.ok(attrs.contacts, 'Fragment array with custom serializer present');
    assert.strictEqual(
      attrs.contacts[0].type,
      'EMAIL',
      'Custom serializer transformation works',
    );
    assert.strictEqual(
      attrs.contacts[1].type,
      'PHONE',
      'Custom serializer transformation works',
    );
    assert.strictEqual(
      attrs.contacts[0].value,
      'custom@serializer.com',
      'Custom serializer preserves other fields',
    );
  });

  test('fragment serializer normalization works correctly', function (assert) {
    const store = this.owner.lookup('service:store');

    // Simulate server data with custom format (uppercase types)
    const serverData = {
      data: {
        type: 'person',
        id: '1',
        attributes: {
          firstName: 'Normalize',
          lastName: 'Test',
          contacts: [
            { type: 'EMAIL', value: 'normalize@test.com', primary: true },
            { type: 'PHONE', value: '555-NORM', primary: false },
          ],
        },
      },
    };

    store.push(serverData);
    const person = store.peekRecord('person', '1');

    const contacts = person.get('contacts');

    // Test that normalization transformed the data back
    assert.strictEqual(
      contacts[0].get('type'),
      'email',
      'Custom serializer normalization works',
    );
    assert.strictEqual(
      contacts[1].get('type'),
      'phone',
      'Custom serializer normalization works',
    );
    assert.strictEqual(
      contacts[0].get('value'),
      'normalize@test.com',
      'Custom serializer preserves other fields during normalization',
    );
  });

  test('empty and null fragment serialization', function (assert) {
    const store = this.owner.lookup('service:store');

    const person = store.createRecord('person', {
      firstName: 'Empty',
      lastName: 'Test',
      fullName: null, // explicitly null fragment
      addresses: [], // empty fragment array
      contacts: [], // empty fragment array
      tags: [], // empty primitive array
      scores: [], // empty primitive array
    });

    const serialized = person.serialize();
    const attrs = serialized.data.attributes;

    // Test null fragment
    assert.strictEqual(
      attrs.fullName,
      null,
      'Null fragment serializes as null',
    );

    // Test empty arrays
    assert.deepEqual(
      attrs.addresses,
      [],
      'Empty fragment array serializes as empty array',
    );
    assert.deepEqual(
      attrs.contacts,
      [],
      'Empty fragment array serializes as empty array',
    );
    assert.deepEqual(
      attrs.tags,
      [],
      'Empty primitive array serializes as empty array',
    );
    assert.deepEqual(
      attrs.scores,
      [],
      'Empty primitive array serializes as empty array',
    );
  });

  test('fragment array snapshot integration', function (assert) {
    const store = this.owner.lookup('service:store');

    // Custom serializer that uses fragment snapshots
    class PersonSerializer extends JSONSerializer {
      serialize(snapshot, options) {
        const json = super.serialize(snapshot, options);

        // Access fragment snapshots
        const fullNameSnapshot = snapshot.attr('fullName');
        if (fullNameSnapshot) {
          json.display_name = `${fullNameSnapshot.attr('first')} ${fullNameSnapshot.attr('last')}`;
        }

        // Access fragment array snapshots
        const addressSnapshots = snapshot.attr('addresses');
        if (addressSnapshots && addressSnapshots.length > 0) {
          json.primary_city = addressSnapshots[0].attr('city');
          json.address_count = addressSnapshots.length;
        }

        // Access primitive array snapshots
        const tagSnapshots = snapshot.attr('tags');
        if (tagSnapshots) {
          json.tag_count = tagSnapshots.length;
        }

        return json;
      }
    }

    this.owner.register('serializer:person', PersonSerializer);

    const person = store.createRecord('person', {
      firstName: 'Snapshot',
      lastName: 'Test',
      fullName: {
        first: 'Snapshot',
        last: 'Test',
      },
      addresses: [
        {
          street: '123 First St',
          city: 'First City',
          state: 'FC',
          zip: '12345',
        },
        {
          street: '456 Second St',
          city: 'Second City',
          state: 'SC',
          zip: '67890',
        },
      ],
      tags: ['snapshot', 'test', 'integration'],
    });

    const serialized = person.serialize();
    const attrs = serialized.data.attributes;

    // Test fragment snapshot access
    assert.strictEqual(
      attrs.display_name,
      'Snapshot Test',
      'Fragment snapshot access works',
    );

    // Test fragment array snapshot access
    assert.strictEqual(
      attrs.primary_city,
      'First City',
      'Fragment array snapshot access works',
    );
    assert.strictEqual(
      attrs.address_count,
      2,
      'Fragment array snapshot length access works',
    );

    // Test primitive array snapshot access
    assert.strictEqual(
      attrs.tag_count,
      3,
      'Primitive array snapshot access works',
    );
  });

  test('serialization preserves JSON format compatibility', function (assert) {
    const store = this.owner.lookup('service:store');

    // Test data that matches expected legacy format
    const expectedFormat = {
      firstName: 'Legacy',
      lastName: 'Compatible',
      fullName: {
        title: 'Mr.',
        first: 'Legacy',
        last: 'Compatible',
      },
      addresses: [
        {
          street: '123 Legacy St',
          city: 'Compatible City',
          state: 'LC',
          zip: '12345',
          country: 'USA',
        },
      ],
      contacts: [
        { type: 'email', value: 'legacy@compatible.com', primary: true },
      ],
      tags: ['legacy', 'compatible'],
      scores: [95, 88],
    };

    const person = store.createRecord('person', expectedFormat);
    const serialized = person.serialize();
    const attrs = serialized.data.attributes;

    // Test that our serialization format exactly matches expected legacy format
    assert.deepEqual(
      attrs.fullName,
      expectedFormat.fullName,
      'Fragment format matches legacy',
    );
    assert.deepEqual(
      attrs.addresses,
      expectedFormat.addresses,
      'Fragment array format matches legacy',
    );
    assert.deepEqual(
      attrs.contacts,
      expectedFormat.contacts,
      'Fragment array format matches legacy',
    );
    assert.deepEqual(
      attrs.tags,
      expectedFormat.tags,
      'Primitive array format matches legacy',
    );
    assert.deepEqual(
      attrs.scores,
      expectedFormat.scores,
      'Primitive array format matches legacy',
    );

    // Test that we can round-trip this exact format
    const roundTripPerson = store.createRecord('person', attrs);
    const roundTripSerialized = roundTripPerson.serialize();

    assert.deepEqual(
      roundTripSerialized.data.attributes,
      attrs,
      'Round-trip preserves exact format',
    );
  });
});
