import { module, test } from 'qunit';
import FragmentArray from 'ember-data-model-fragments/array/fragment';
import Fragment from 'ember-data-model-fragments/fragment';

module('Unit | FragmentArray', function () {
  test('FragmentArray can be instantiated', function (assert) {
    const array = new FragmentArray();
    // Using custom property for type checking, which is more reliable with 
    // extended built-in classes like Array
    assert.ok(array.constructor === FragmentArray, 'Array instance created');
    assert.ok(Array.isArray(array), 'Is an array');
    assert.strictEqual(array.length, 0, 'Starts empty');
  });

  test('FragmentArray can be instantiated with content', function (assert) {
    const content = ['item1', 'item2', 'item3'];
    const array = new FragmentArray(content);

    assert.strictEqual(array.length, 3, 'Has correct length');
    assert.strictEqual(array[0], 'item1', 'First item correct');
    assert.strictEqual(array[2], 'item3', 'Last item correct');
  });

  test('FragmentArray is reactive to changes', function (assert) {
    const array = new FragmentArray(['initial']);

    array.push('new item');
    assert.strictEqual(array.length, 2, 'Length updated');

    array.pop();
    assert.strictEqual(array.length, 1, 'Length updated after pop');
  });

  test('FragmentArray supports Ember Array methods', function (assert) {
    const array = new FragmentArray();

    // Test pushObject
    array.pushObject('item1');
    assert.strictEqual(array.length, 1, 'pushObject works');
    assert.strictEqual(array[0], 'item1', 'Item added correctly');

    // Test pushObjects
    array.pushObjects(['item2', 'item3']);
    assert.strictEqual(array.length, 3, 'pushObjects works');

    // Test removeObject
    array.removeObject('item2');
    assert.strictEqual(array.length, 2, 'removeObject works');
    assert.strictEqual(array.indexOf('item2'), -1, 'Item removed');

    // Test insertAt
    array.insertAt(1, 'inserted');
    assert.strictEqual(array.length, 3, 'insertAt works');
    assert.strictEqual(
      array[1],
      'inserted',
      'Item inserted at correct position',
    );

    // Test removeAt
    array.removeAt(1);
    assert.strictEqual(array.length, 2, 'removeAt works');
    assert.strictEqual(array[1], 'item3', 'Correct item remains');

    // Test clear
    array.clear();
    assert.strictEqual(array.length, 0, 'clear works');
  });

  test('FragmentArray utility methods work', function (assert) {
    const array = new FragmentArray(['first', 'middle', 'last']);

    assert.strictEqual(array.firstObject, 'first', 'firstObject works');
    assert.strictEqual(array.lastObject, 'last', 'lastObject works');
    assert.strictEqual(array.objectAt(1), 'middle', 'objectAt works');
  });

  test('FragmentArray tracks dirty state', function (assert) {
    const array = new FragmentArray(['original']);

    assert.false(array.hasDirtyAttributes, 'Array starts clean');

    array.push('new item');
    assert.true(
      array.hasDirtyAttributes,
      'Array becomes dirty after adding item',
    );

    array.rollbackAttributes();
    assert.false(array.hasDirtyAttributes, 'Array is clean after rollback');
    assert.strictEqual(array.length, 1, 'Length restored after rollback');
    assert.strictEqual(array[0], 'original', 'Original content restored');
  });

  test('FragmentArray serializes correctly', function (assert) {
    const array = new FragmentArray(['item1', 'item2']);
    const serialized = array.serialize();

    assert.deepEqual(
      serialized,
      ['item1', 'item2'],
      'Serializes to simple array',
    );
  });

  test('FragmentArray with fragments', function (assert) {
    // Create a simple fragment class for testing
    class TestFragment extends Fragment {
      static modelName = 'test-fragment';
      static attributes = {
        name: { type: 'string', options: {} },
        value: { type: 'number', options: {} },
      };
    }

    // Mock owner with store
    const mockOwner = {
      store: {
        modelFor: (type) => {
          if (type === 'test-fragment') return TestFragment;
          throw new Error(`Unknown type: ${type}`);
        },
      },
      notifyPropertyChange: () => {},
    };

    const array = new FragmentArray(
      [],
      mockOwner,
      'testFragments',
      'test-fragment',
    );

    // Test createFragment
    const fragment = array.createFragment({ name: 'Test', value: 42 });
    assert.ok(
      fragment instanceof TestFragment,
      'createFragment creates correct type',
    );
    assert.strictEqual(array.length, 1, 'Fragment added to array');
    assert.strictEqual(
      fragment.get('name'),
      'Test',
      'Fragment has correct data',
    );

    // Test serialization with fragments
    const serialized = array.serialize();
    assert.deepEqual(
      serialized,
      [{ name: 'Test', value: 42 }],
      'Fragments serialize correctly',
    );
  });

  test('FragmentArray dirty tracking with fragments', function (assert) {
    class TestFragment extends Fragment {
      static modelName = 'test-fragment';
    }

    const fragment1 = new TestFragment({ name: 'original' });
    const fragment2 = new TestFragment({ name: 'also original' });

    const array = new FragmentArray([fragment1, fragment2]);

    assert.false(
      array.hasDirtyAttributes,
      'Array with clean fragments is clean',
    );

    // Make a fragment dirty
    fragment1.set('name', 'changed');
    assert.true(array.hasDirtyAttributes, 'Array with dirty fragment is dirty');

    // Clean the fragment
    fragment1.rollbackAttributes();
    assert.false(
      array.hasDirtyAttributes,
      'Array is clean when fragments are clean',
    );
  });
});
