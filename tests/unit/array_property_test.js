import Ember from 'ember';
import MF from 'model-fragments';
import { test } from 'qunit';
import moduleForAcceptance from '../helpers/module-for-acceptance';
import getOwner from '../helpers/get-owner';
import Person from 'dummy/models/person';

let store;

moduleForAcceptance('unit - `MF.array` property', {
  beforeEach(assert) {
    store = getOwner(this).lookup('service:store');

    assert.expectNoDeprecation();
  },

  afterEach() {
    store = null;
  }
});

test('array properties are converted to an array-ish containing original values', function(assert) {
  let values = [ 'Hand of the King', 'Master of Coin' ];

  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          nickName: 'Tyrion Lannister',
          titles: values
        }
      }
    });

    return store.find('person', 1).then(person => {
      let titles = person.get('titles');

      assert.ok(Ember.isArray(titles), 'property is array-like');

      assert.ok(titles.every((title, index) => {
        return title === values[index];
      }), 'each title matches the original value');
    });
  });
});

test('null values are allowed', function(assert) {
  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          nickName: 'Many-Faced God',
          titles: null
        }
      }
    });

    return store.find('person', 1).then(person => {
      assert.equal(person.get('titles'), null, 'property is null');
    });
  });
});

test('setting to null is allowed', function(assert) {
  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          nickName: 'R\'hllor',
          titles: [ 'Lord of Light', 'The Heart of Fire', 'The God of Flame and Shadow' ]
        }
      }
    });

    return store.find('person', 1).then(person => {
      person.set('titles', null);

      assert.equal(person.get('titles'), null, 'property is null');
    });
  });
});

test('array properties default to an empty array-ish', function(assert) {
  Ember.run(() => {
    let person = store.createRecord('person', {
      nickName: 'Boros Blount'
    });

    assert.deepEqual(person.get('titles').toArray(), [], 'default value is correct');
  });
});

test('array properties can have default values', function(assert) {
  Ember.run(() => {
    Person.reopen({
      titles: MF.array({ defaultValue: [ 'Ser' ] })
    });

    let person = store.createRecord('person', {
      nickName: 'Barristan Selmy'
    });

    assert.ok(person.get('titles.length'), 1, 'default value length is correct');
    assert.equal(person.get('titles.firstObject'), 'Ser', 'default value is correct');
  });
});

test('default values can be functions', function(assert) {
  Ember.run(() => {
    Person.reopen({
      titles: MF.array({ defaultValue() { return [ 'Viper' ]; } })
    });

    let person = store.createRecord('person', {
      nickName: 'Oberyn Martell'
    });

    assert.ok(person.get('titles.length'), 1, 'default value length is correct');
    assert.equal(person.get('titles.firstObject'), 'Viper', 'default value is correct');
  });
});
