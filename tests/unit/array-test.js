import { module, test } from 'qunit';
import { PrimitiveArray } from 'ember-data-model-fragments/transforms/array';
import ArrayTransform from 'ember-data-model-fragments/transforms/array';

module('Unit | PrimitiveArray and ArrayTransform', function () {
  test('PrimitiveArray can be instantiated', function (assert) {
    const array = new PrimitiveArray();
    assert.ok(array instanceof PrimitiveArray, 'Array instance created');
    assert.ok(Array.isArray(array), 'Is an array');
    assert.strictEqual(array.length, 0, 'Starts empty');
  });

  test('PrimitiveArray works with primitive values', function (assert) {
    const array = new PrimitiveArray(['string1', 'string2']);

    assert.strictEqual(array.length, 2, 'Has correct length');
    assert.strictEqual(array[0], 'string1', 'First item correct');

    array.push('string3');
    assert.strictEqual(array.length, 3, 'Push works');
    assert.true(array.hasDirtyAttributes, 'Becomes dirty after change');

    array.rollbackAttributes();
    assert.strictEqual(array.length, 2, 'Rollback restores length');
    assert.false(array.hasDirtyAttributes, 'Clean after rollback');
  });

  test('PrimitiveArray serializes correctly', function (assert) {
    const stringArray = new PrimitiveArray(['a', 'b', 'c']);
    const numberArray = new PrimitiveArray([1, 2, 3]);
    const booleanArray = new PrimitiveArray([true, false, true]);

    assert.deepEqual(
      stringArray.serialize(),
      ['a', 'b', 'c'],
      'String array serializes',
    );
    assert.deepEqual(
      numberArray.serialize(),
      [1, 2, 3],
      'Number array serializes',
    );
    assert.deepEqual(
      booleanArray.serialize(),
      [true, false, true],
      'Boolean array serializes',
    );
  });

  test('PrimitiveArray supports Ember Array methods', function (assert) {
    const array = new PrimitiveArray();

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

  test('PrimitiveArray utility methods work', function (assert) {
    const array = new PrimitiveArray(['first', 'middle', 'last']);

    assert.strictEqual(array.firstObject, 'first', 'firstObject works');
    assert.strictEqual(array.lastObject, 'last', 'lastObject works');
    assert.strictEqual(array.objectAt(1), 'middle', 'objectAt works');
  });

  test('PrimitiveArray change notification', function (assert) {
    let notificationCount = 0;
    const mockOwner = {
      notifyPropertyChange: () => {
        notificationCount++;
      },
    };

    const array = new PrimitiveArray(['initial'], mockOwner, 'testArray');

    array.push('new item');
    assert.strictEqual(
      notificationCount,
      2,
      'Two notifications sent (property + hasDirtyAttributes)',
    );

    notificationCount = 0;
    array.pop();
    assert.strictEqual(notificationCount, 2, 'Notifications sent for pop');

    notificationCount = 0;
    array.clear();
    assert.strictEqual(notificationCount, 2, 'Notifications sent for clear');
  });

  test('ArrayTransform deserializes correctly', function (assert) {
    const transform = new ArrayTransform();

    // Test basic array
    const result1 = transform.deserialize(['a', 'b', 'c'], {});
    assert.ok(result1 instanceof PrimitiveArray, 'Returns PrimitiveArray');
    assert.deepEqual(result1.slice(), ['a', 'b', 'c'], 'Content is correct');

    // Test with itemType
    const result2 = transform.deserialize(['1', '2', '3'], {
      itemType: 'number',
    });
    assert.deepEqual(result2.slice(), [1, 2, 3], 'Numbers converted correctly');

    // Test with defaultValue
    const result3 = transform.deserialize(null, {
      defaultValue: ['default1', 'default2'],
    });
    assert.ok(
      result3 instanceof PrimitiveArray,
      'Returns PrimitiveArray for null input',
    );
    assert.deepEqual(
      result3.slice(),
      ['default1', 'default2'],
      'Default value used',
    );

    // Test empty array default
    const result4 = transform.deserialize(null, {});
    assert.ok(
      result4 instanceof PrimitiveArray,
      'Returns PrimitiveArray for null input',
    );
    assert.strictEqual(result4.length, 0, 'Defaults to empty array');
  });

  test('ArrayTransform serializes correctly', function (assert) {
    const transform = new ArrayTransform();

    // Test basic serialization
    const array1 = new PrimitiveArray(['a', 'b', 'c']);
    const result1 = transform.serialize(array1, {});
    assert.deepEqual(result1, ['a', 'b', 'c'], 'Basic serialization works');

    // Test with itemType
    const array2 = new PrimitiveArray([1, 2, 3]);
    const result2 = transform.serialize(array2, { itemType: 'string' });
    assert.deepEqual(result2, ['1', '2', '3'], 'Type conversion works');

    // Test null/empty cases
    const result3 = transform.serialize(null, {});
    assert.deepEqual(result3, [], 'Null serializes to empty array');

    const result4 = transform.serialize(undefined, {});
    assert.deepEqual(result4, [], 'Undefined serializes to empty array');
  });

  test('ArrayTransform handles different item types', function (assert) {
    const transform = new ArrayTransform();

    // Test string type
    const stringResult = transform.deserialize([1, 2, 3], {
      itemType: 'string',
    });
    assert.deepEqual(
      stringResult.slice(),
      ['1', '2', '3'],
      'String conversion works',
    );

    // Test number type
    const numberResult = transform.deserialize(['1', '2', '3'], {
      itemType: 'number',
    });
    assert.deepEqual(
      numberResult.slice(),
      [1, 2, 3],
      'Number conversion works',
    );

    // Test boolean type
    const booleanResult = transform.deserialize([1, 0, 'true', ''], {
      itemType: 'boolean',
    });
    assert.deepEqual(
      booleanResult.slice(),
      [true, false, true, false],
      'Boolean conversion works',
    );

    // Test date type
    const dateString = '2023-01-01T00:00:00.000Z';
    const dateResult = transform.deserialize([dateString], {
      itemType: 'date',
    });
    assert.ok(dateResult[0] instanceof Date, 'Date conversion works');
    assert.strictEqual(
      dateResult[0].toISOString(),
      dateString,
      'Date value correct',
    );
  });

  test('ArrayTransform handles default values', function (assert) {
    const transform = new ArrayTransform();

    // Test function default value
    const result1 = transform.deserialize(null, {
      defaultValue: () => ['dynamic', 'default'],
    });
    assert.deepEqual(
      result1.slice(),
      ['dynamic', 'default'],
      'Function default value works',
    );

    // Test array default value
    const result2 = transform.deserialize(null, {
      defaultValue: ['static', 'default'],
    });
    assert.deepEqual(
      result2.slice(),
      ['static', 'default'],
      'Array default value works',
    );

    // Test single value default
    const result3 = transform.deserialize(null, {
      defaultValue: 'single',
    });
    assert.deepEqual(result3.slice(), ['single'], 'Single value becomes array');
  });

  test('ArrayTransform error handling', function (assert) {
    const transform = new ArrayTransform();

    // Test non-array input
    assert.throws(
      () => {
        transform.deserialize('not an array', {});
      },
      /Expected array/,
      'Throws error for non-array input',
    );

    assert.throws(
      () => {
        transform.deserialize({ not: 'array' }, {});
      },
      /Expected array/,
      'Throws error for object input',
    );
  });

  test('PrimitiveArray replace method works', function (assert) {
    const array = new PrimitiveArray(['item1', 'item2', 'item3']);

    array.replace(1, 1, ['replaced']);
    assert.strictEqual(array.length, 3, 'Replace maintains correct length');
    assert.strictEqual(array[0], 'item1', 'First item unchanged');
    assert.strictEqual(array[1], 'replaced', 'Middle item replaced');
    assert.strictEqual(array[2], 'item3', 'Last item unchanged');
  });

  test('PrimitiveArray removeObjects method works', function (assert) {
    const array = new PrimitiveArray(['item1', 'item2', 'item3', 'item2']);

    array.removeObjects(['item2']);
    assert.strictEqual(array.length, 2, 'Removes all instances');
    assert.deepEqual(array.slice(), ['item1', 'item3'], 'Correct items remain');
  });
});
