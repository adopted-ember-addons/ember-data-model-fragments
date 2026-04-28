import Model, { attr } from '@ember-data/model';
import { fragment, fragmentArray, array } from '#src/attributes/index.ts';
import { isArray } from '@ember/array';
import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupApplicationTest } from '../helpers/index.ts';

let store: any;
class Person extends Model {
  @attr('string') declare title: string;
  @attr('string') declare nickName: string;
  @fragment('name') declare name: unknown;
  @fragmentArray('name') declare names: unknown;
  @fragmentArray('address') declare addresses: unknown;
  @array() declare titles: unknown;
  @fragmentArray('hobby', { defaultValue: null }) declare hobbies: unknown;
  @fragmentArray('house') declare houses: unknown;
  @array() declare children: unknown;
  @array('string') declare strings: unknown;
  @array('number') declare numbers: unknown;
  @array('boolean') declare booleans: unknown;
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

    const person = await store.findRecord('person', 1);
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

    const person = await store.findRecord('person', 1);
    const titles = person.titles;

    assert.ok(isArray(titles), 'property is array-like');

    assert.ok(
      titles.every((title: string, index: number) => {
        return title === values[index];
      }),
      'each title matches the original value',
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

    const person = await store.findRecord('person', 1);
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

    const person = await store.findRecord('person', 1);
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

    const person = await store.findRecord('person', 1);
    person.set('titles', ['hello', 'there']);

    assert.deepEqual(
      person.titles.toArray(),
      ['hello', 'there'],
      'property has correct values',
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
      declare titles: unknown;
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
      @array({ defaultValue: () => ['Viper'] }) declare titles: unknown;
    }
    this.owner.register('model:person', PersonWithDefaults);

    const person = store.createRecord('person', {
      nickName: 'Oberyn Martell',
    });

    assert.equal(person.titles.length, 1, 'default value length is correct');
    assert.equal(
      person.titles.firstObject,
      'Viper',
      'default value is correct',
    );
  });

  test('default values that are functions are not deep copied', function (assert) {
    class PersonWithDefaults extends Person {
      @array({
        defaultValue() {
          return ['Viper', EmberObject.create({ item: 'Longclaw' } as object)];
        },
      })
      declare titles: unknown;
    }
    this.owner.register('model:person', PersonWithDefaults);

    const person = store.createRecord('person', {
      nickName: 'Oberyn Martell',
    });

    assert.equal(person.titles.length, 2, 'default value length is correct');
    assert.equal(
      person.titles.firstObject,
      'Viper',
      'default value is correct',
    );
  });

  test('preserve fragment array when record is unloaded', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          titles: ['Hand of the King', 'Master of Coin'],
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const titles = person.titles;

    assert.strictEqual(titles.length, 2);

    const titleBefore = titles.objectAt(0);
    assert.strictEqual(titleBefore, 'Hand of the King');

    person.unloadRecord();

    assert.strictEqual(
      person.titles,
      titles,
      'StatefulArray instance is the same after unload',
    );

    const titleAfter = titles.objectAt(0);

    assert.strictEqual(
      titleAfter,
      titleBefore,
      'preserve array contents after unload',
    );
  });
});
