import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Model from '@ember-data/model';
import Fragment, { attr } from 'ember-data-model-fragments/fragment';
import {
  fragment,
  fragmentArray,
  array,
} from 'ember-data-model-fragments/attributes';

module('Unit | Model Extensions', function (hooks) {
  setupTest(hooks);

  test('Model has createFragment method', function (assert) {
    // Define a simple fragment
    class NameFragment extends Fragment {
      static modelName = 'name';
      @attr('string') first;
      @attr('string') last;
    }

    // Define a model that uses fragments
    class PersonModel extends Model {
      @fragment('name') name;
    }

    // Register with test container
    this.owner.register('model:name', NameFragment);
    this.owner.register('model:person', PersonModel);

    const store = this.owner.lookup('service:store');
    const person = store.createRecord('person');

    // Test that createFragment method exists
    assert.ok(
      typeof person.createFragment === 'function',
      'Model has createFragment method',
    );

    // Test creating a fragment
    const nameFragment = person.createFragment('name', {
      first: 'John',
      last: 'Doe',
    });
    assert.ok(
      nameFragment instanceof NameFragment,
      'createFragment returns correct instance',
    );
    assert.strictEqual(
      nameFragment.get('first'),
      'John',
      'Fragment has correct data',
    );
    assert.strictEqual(
      nameFragment.get('last'),
      'Doe',
      'Fragment has correct data',
    );
  });

  test('Model dirty tracking includes fragments', function (assert) {
    class NameFragment extends Fragment {
      static modelName = 'name';
      @attr('string') first;
      @attr('string') last;
    }

    class PersonModel extends Model {
      @fragment('name') name;
    }

    this.owner.register('model:name', NameFragment);
    this.owner.register('model:person', PersonModel);

    const store = this.owner.lookup('service:store');
    const person = store.createRecord('person', {
      name: { first: 'John', last: 'Doe' },
    });

    // Initially clean (new records might be dirty, so let's simulate a clean state)
    const nameFragment = person.get('name');
    nameFragment._originalAttributes = { ...nameFragment._attributes };

    assert.false(person.hasDirtyAttributes, 'Model starts clean');

    // Make fragment dirty
    nameFragment.set('first', 'Jane');
    assert.true(
      person.hasDirtyAttributes,
      'Model is dirty when fragment is dirty',
    );

    // Test changedAttributes includes fragment changes
    const changes = person.changedAttributes;
    assert.ok(changes.name, 'Changed attributes includes fragment changes');
  });

  test('Model rollback includes fragments', function (assert) {
    class NameFragment extends Fragment {
      static modelName = 'name';
      @attr('string') first;
      @attr('string') last;
    }

    class PersonModel extends Model {
      @fragment('name') name;
    }

    this.owner.register('model:name', NameFragment);
    this.owner.register('model:person', PersonModel);

    const store = this.owner.lookup('service:store');
    const person = store.createRecord('person', {
      name: { first: 'John', last: 'Doe' },
    });

    const nameFragment = person.get('name');

    // Set up clean state
    nameFragment._originalAttributes = { ...nameFragment._attributes };

    // Make changes
    nameFragment.set('first', 'Jane');
    assert.strictEqual(nameFragment.get('first'), 'Jane', 'Fragment changed');
    assert.true(person.hasDirtyAttributes, 'Model is dirty');

    // Rollback
    person.rollbackAttributes();
    assert.strictEqual(
      nameFragment.get('first'),
      'John',
      'Fragment rolled back',
    );
    assert.false(person.hasDirtyAttributes, 'Model is clean after rollback');
  });

  test('Model works with fragment arrays', function (assert) {
    class AddressFragment extends Fragment {
      static modelName = 'address';
      @attr('string') street;
      @attr('string') city;
    }

    class PersonModel extends Model {
      @fragmentArray('address') addresses;
    }

    this.owner.register('model:address', AddressFragment);
    this.owner.register('model:person', PersonModel);

    const store = this.owner.lookup('service:store');
    const person = store.createRecord('person', {
      addresses: [{ street: '123 Main St', city: 'Anytown' }],
    });

    const addresses = person.get('addresses');
    assert.ok(addresses, 'Fragment array exists');
    assert.strictEqual(
      addresses.length,
      1,
      'Fragment array has correct length',
    );

    // Set up clean state
    addresses._originalContent = addresses.slice();
    addresses.forEach((addr) => {
      addr._originalAttributes = { ...addr._attributes };
    });

    assert.false(person.hasDirtyAttributes, 'Model starts clean');

    // Add new address
    addresses.createFragment({ street: '456 Oak Ave', city: 'Somewhere' });
    assert.true(
      person.hasDirtyAttributes,
      'Model is dirty after adding fragment',
    );

    // Rollback
    person.rollbackAttributes();
    assert.strictEqual(addresses.length, 1, 'Fragment array rolled back');
    assert.false(person.hasDirtyAttributes, 'Model is clean after rollback');
  });

  test('Model works with primitive arrays', function (assert) {
    class PersonModel extends Model {
      @array('string') tags;
    }

    this.owner.register('model:person', PersonModel);

    const store = this.owner.lookup('service:store');
    const person = store.createRecord('person', {
      tags: ['developer', 'ember'],
    });

    const tags = person.get('tags');
    assert.ok(tags, 'Array exists');
    assert.strictEqual(tags.length, 2, 'Array has correct length');

    // Set up clean state
    tags._originalContent = tags.slice();

    assert.false(person.hasDirtyAttributes, 'Model starts clean');

    // Add new tag
    tags.push('javascript');
    assert.true(person.hasDirtyAttributes, 'Model is dirty after adding item');

    // Rollback
    person.rollbackAttributes();
    assert.strictEqual(tags.length, 2, 'Array rolled back');
    assert.false(person.hasDirtyAttributes, 'Model is clean after rollback');
  });

  test('hasFragmentAttributes helper method works', function (assert) {
    class FragmentModel extends Model {
      @fragment('name') name;
    }

    class RegularModel extends Model {
      @attr('string') name;
    }

    this.owner.register('model:fragment-model', FragmentModel);
    this.owner.register('model:regular-model', RegularModel);

    const store = this.owner.lookup('service:store');

    const fragmentModel = store.createRecord('fragment-model');
    const regularModel = store.createRecord('regular-model');

    assert.true(
      fragmentModel.hasFragmentAttributes(),
      'Model with fragments returns true',
    );
    assert.false(
      regularModel.hasFragmentAttributes(),
      'Model without fragments returns false',
    );
  });

  test('createFragment throws helpful errors', function (assert) {
    class PersonModel extends Model {
      @fragment('name') name;
    }

    this.owner.register('model:person', PersonModel);

    const store = this.owner.lookup('service:store');
    const person = store.createRecord('person');

    // Test error when fragment type doesn't exist
    assert.throws(
      () => {
        person.createFragment('nonexistent');
      },
      /Could not find fragment class for type: nonexistent/,
      'Throws helpful error for missing fragment type',
    );
  });
});
