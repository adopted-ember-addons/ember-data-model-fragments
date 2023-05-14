import Model, { attr } from '@ember-data/model';
import { isArray } from '@ember/array';
import { run } from '@ember/runloop';
import EmberObject from '@ember/object';
import MF from 'ember-data-model-fragments';
import { module, test } from 'qunit';

import { setupApplicationTest } from 'ember-qunit';
// import Person from 'dummy/models/person';

let store;
let Person = Model.extend({
  title: attr('string'),
  nickName: attr('string'),
  name: MF.fragment('name'),
  names: MF.fragmentArray('name'),
  addresses: MF.fragmentArray('address'),
  titles: MF.array(),
  hobbies: MF.fragmentArray('hobby', { defaultValue: null }),
  houses: MF.fragmentArray('house'),
  children: MF.array(),
  strings: MF.array('string'),
  numbers: MF.array('number'),
  booleans: MF.array('boolean'),
});

module('unit - `MF.array` property', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function (assert) {
    store = this.owner.lookup('service:store');
    this.owner.register('model:person', Person);
    assert.expectNoDeprecation();
  });

  hooks.afterEach(function () {
    store = null;
  });

  test('array properties are converted to an array-ish containing original values', function (assert) {
    let values = ['Hand of the King', 'Master of Coin'];

    run(() => {
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

      return store.find('person', 1).then((person) => {
        let titles = person.get('titles');

        assert.ok(isArray(titles), 'property is array-like');

        assert.ok(
          titles.every((title, index) => {
            return title === values[index];
          }),
          'each title matches the original value'
        );
      });
    });
  });

  test('null values are allowed', function (assert) {
    run(() => {
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

      return store.find('person', 1).then((person) => {
        assert.equal(person.get('titles'), null, 'property is null');
      });
    });
  });

  test('setting to null is allowed', function (assert) {
    run(() => {
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

      return store.find('person', 1).then((person) => {
        person.set('titles', null);

        assert.equal(person.get('titles'), null, 'property is null');
      });
    });
  });

  test('setting to array value is allowed', function (assert) {
    run(() => {
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

      return store.find('person', 1).then((person) => {
        person.set('titles', ['hello', 'there']);

        assert.deepEqual(
          person.get('titles').toArray(),
          ['hello', 'there'],
          'property has correct values'
        );
      });
    });
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

    assert.equal(person.get('titles'), null, 'property is null');
  });

  test('array properties default to an empty array-ish', function (assert) {
    run(() => {
      let person = store.createRecord('person', {
        nickName: 'Boros Blount',
      });

      assert.deepEqual(
        person.get('titles').toArray(),
        [],
        'default value is correct'
      );
    });
  });

  test('array properties can have default values', function (assert) {
    run(() => {
      Person.reopen({
        titles: MF.array({ defaultValue: ['Ser'] }),
      });

      let person = store.createRecord('person', {
        nickName: 'Barristan Selmy',
      });

      assert.equal(
        person.get('titles.length'),
        1,
        'default value length is correct'
      );
      assert.equal(
        person.get('titles.firstObject'),
        'Ser',
        'default value is correct'
      );
    });
  });

  test('default values can be functions', function (assert) {
    run(() => {
      Person.reopen({
        titles: MF.array({
          defaultValue() {
            return ['Viper'];
          },
        }),
      });

      let person = store.createRecord('person', {
        nickName: 'Oberyn Martell',
      });

      assert.equal(
        person.get('titles.length'),
        1,
        'default value length is correct'
      );
      assert.equal(
        person.get('titles.firstObject'),
        'Viper',
        'default value is correct'
      );
    });
  });

  test('default values that are functions are not deep copied', function (assert) {
    run(() => {
      Person.reopen({
        titles: MF.array({
          defaultValue() {
            return ['Viper', EmberObject.create({ item: 'Longclaw' })];
          },
        }),
      });

      let person = store.createRecord('person', {
        nickName: 'Oberyn Martell',
      });

      assert.equal(
        person.get('titles.length'),
        2,
        'default value length is correct'
      );
      assert.equal(
        person.get('titles.firstObject'),
        'Viper',
        'default value is correct'
      );
    });
  });

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
    const titles = person.get('titles');
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
});
