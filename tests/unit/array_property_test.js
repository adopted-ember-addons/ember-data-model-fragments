import Model, { attr } from '@ember-data/model';
import {
  fragment,
  fragmentArray,
  array,
} from 'ember-data-model-fragments/attributes';
import { isArray } from '@ember/array';
import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupApplicationTest } from '../helpers';
import { gte } from 'ember-compatibility-helpers';

let store;
class Person extends Model {
  @attr('string') title;
  @attr('string') nickName;
  @fragment('name') name;
  @fragmentArray('name') names;
  @fragmentArray('address') addresses;
  @array() titles;
  @fragmentArray('hobby', { defaultValue: null }) hobbies;
  @fragmentArray('house') houses;
  @array() children;
  @array('string') strings;
  @array('number') numbers;
  @array('boolean') booleans;
}

module('unit - `MF.array` property', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    store = this.owner.lookup('service:store');
    this.owner.register('model:person', Person);
  });

  hooks.afterEach(function () {
    store = null;
  });

  test('arrays have an owner', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          titles: ['Hand of the King', 'Master of Coin'],
        },
      },
    });

    const person = await store.find('person', 1);
    assert.strictEqual(person.titles.owner, person);
  });

  test('array properties are converted to an array-ish containing original values', async function (assert) {
    const values = ['Hand of the King', 'Master of Coin'];

    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          nickName: 'Tyrion Lannister',
          titles: values,
        },
      },
    });

    const person = await store.find('person', 1);
    const titles = person.titles;

    assert.ok(isArray(titles), 'property is array-like');

    assert.ok(
      titles.every((title, index) => {
        return title === values[index];
      }),
      'each title matches the original value'
    );
  });

  test('null values are allowed', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          nickName: 'Many-Faced God',
          titles: null,
        },
      },
    });

    const person = await store.find('person', 1);
    assert.equal(person.titles, null, 'property is null');
  });

  test('setting to null is allowed', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          nickName: "R'hllor",
          titles: [
            'Lord of Light',
            'The Heart of Fire',
            'The God of Flame and Shadow',
          ],
        },
      },
    });

    const person = await store.find('person', 1);
    person.set('titles', null);

    assert.equal(person.titles, null, 'property is null');
  });

  test('setting to array value is allowed', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          nickName: "R'hllor",
          titles: [
            'Lord of Light',
            'The Heart of Fire',
            'The God of Flame and Shadow',
          ],
        },
      },
    });

    const person = await store.find('person', 1);
    person.set('titles', ['hello', 'there']);

    assert.deepEqual(
      person.titles.toArray(),
      ['hello', 'there'],
      'property has correct values'
    );
  });

  test('resetting to null is allowed', function (assert) {
    const person = store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          nickName: "R'hllor",
          titles: null,
        },
      },
    });

    person.set('titles', [
      'Lord of Light',
      'The Heart of Fire',
      'The God of Flame and Shadow',
    ]);
    person.set('titles', null);

    assert.equal(person.titles, null, 'property is null');
  });

  test('array properties default to an empty array-ish', function (assert) {
    const person = store.createRecord('person', {
      nickName: 'Boros Blount',
    });

    assert.deepEqual(person.titles.toArray(), [], 'default value is correct');
  });

  test('array properties can have default values', function (assert) {
    class PersonWithDefaults extends Person {
      @array({ defaultValue: ['Ser'] })
      titles;
    }
    this.owner.register('model:person', PersonWithDefaults);

    const person = store.createRecord('person', {
      nickName: 'Barristan Selmy',
    });

    assert.equal(person.titles.length, 1, 'default value length is correct');
    assert.equal(person.titles.firstObject, 'Ser', 'default value is correct');
  });

  test('default values can be functions', function (assert) {
    class PersonWithDefaults extends Person {
      @array({ defaultValue: () => ['Viper'] }) titles;
    }
    this.owner.register('model:person', PersonWithDefaults);

    const person = store.createRecord('person', {
      nickName: 'Oberyn Martell',
    });

    assert.equal(person.titles.length, 1, 'default value length is correct');
    assert.equal(
      person.titles.firstObject,
      'Viper',
      'default value is correct'
    );
  });

  test('default values that are functions are not deep copied', function (assert) {
    class PersonWithDefaults extends Person {
      @array({
        defaultValue() {
          return ['Viper', EmberObject.create({ item: 'Longclaw' })];
        },
      })
      titles;
    }
    this.owner.register('model:person', PersonWithDefaults);

    const person = store.createRecord('person', {
      nickName: 'Oberyn Martell',
    });

    assert.equal(person.titles.length, 2, 'default value length is correct');
    assert.equal(
      person.titles.firstObject,
      'Viper',
      'default value is correct'
    );
  });

  if (!gte('4.0.0')) {
    // array observers were deprecated in ember 3.26 and removed in 4.0
    // https://deprecations.emberjs.com/v3.x#toc_array-observers
    // https://github.com/emberjs/ember.js/pull/19833

    test('supports array observers', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            nickName: 'Tyrion Lannister',
            titles: ['Hand of the King'],
          },
        },
      });

      this.arrayWillChange = function (array, start, removeCount, addCount) {
        assert.step(`arrayWillChange(${start},${removeCount},${addCount})`);
      };
      this.arrayDidChange = function (array, start, removeCount, addCount) {
        assert.step(`arrayDidChange(${start},${removeCount},${addCount})`);
      };

      const person = await store.find('person', 1);
      const titles = person.titles;
      titles.addArrayObserver(this, {
        willChange: 'arrayWillChange',
        didChange: 'arrayDidChange',
      });
      titles.pushObject('Master of Coin');

      assert.verifySteps(['arrayWillChange(1,0,1)', 'arrayDidChange(1,0,1)']);

      titles.clear();

      assert.verifySteps(['arrayWillChange(0,2,0)', 'arrayDidChange(0,2,0)']);

      titles.removeArrayObserver(this);
    });
  }
});
