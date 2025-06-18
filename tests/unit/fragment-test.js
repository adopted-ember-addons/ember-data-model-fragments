import { module, test } from 'qunit';
import Fragment, { attr } from 'ember-data-model-fragments/fragment';

module('Unit | Fragment', function () {
  test('Fragment can be instantiated', function (assert) {
    const fragment = new Fragment();
    assert.ok(fragment instanceof Fragment, 'Fragment instance created');
  });

  test('Fragment can be instantiated with data', function (assert) {
    const data = { name: 'Test', age: 25 };
    const fragment = new Fragment(data);

    assert.strictEqual(fragment.get('name'), 'Test', 'Name attribute set');
    assert.strictEqual(fragment.get('age'), 25, 'Age attribute set');
  });

  test('Fragment can set and get attributes', function (assert) {
    const fragment = new Fragment();

    fragment.set('name', 'John');
    assert.strictEqual(
      fragment.get('name'),
      'John',
      'Can set and get attributes',
    );

    fragment.set('name', 'Jane');
    assert.strictEqual(fragment.get('name'), 'Jane', 'Can update attributes');
  });

  test('Fragment tracks dirty state', function (assert) {
    const fragment = new Fragment({ name: 'Original' });

    assert.false(fragment.hasDirtyAttributes, 'Fragment starts clean');

    fragment.set('name', 'Changed');
    assert.true(
      fragment.hasDirtyAttributes,
      'Fragment becomes dirty after change',
    );

    fragment.rollbackAttributes();
    assert.false(
      fragment.hasDirtyAttributes,
      'Fragment is clean after rollback',
    );
    assert.strictEqual(
      fragment.get('name'),
      'Original',
      'Attribute rolled back',
    );
  });

  test('Fragment can define typed attributes', function (assert) {
    class NameFragment extends Fragment {
      static modelName = 'name';
      static attributes = {
        first: { type: 'string', options: {} },
        last: { type: 'string', options: {} },
      };
    }

    const fragment = new NameFragment({ first: 'John', last: 'Doe' });

    assert.strictEqual(fragment.get('first'), 'John');
    assert.strictEqual(fragment.get('last'), 'Doe');

    // Test that we can iterate over attributes
    const attributeKeys = [];
    fragment.eachAttribute((key) => {
      attributeKeys.push(key);
    });

    assert.deepEqual(
      attributeKeys.sort(),
      ['first', 'last'],
      'Can iterate over attributes',
    );
  });

  test('Fragment serializes to JSON', function (assert) {
    const fragment = new Fragment({ name: 'Test', value: 42 });
    const serialized = fragment.serialize();

    assert.deepEqual(
      serialized,
      { name: 'Test', value: 42 },
      'Serializes correctly',
    );
  });
});
