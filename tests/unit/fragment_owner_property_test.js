import Ember from 'ember';
import DS from 'ember-data';
import MF from 'ember-data-model-fragments';
import { test } from 'qunit';
import moduleForAcceptance from '../helpers/module-for-acceptance';
import getOwner from '../helpers/get-owner';

let store, owner;
let all = Ember.RSVP.all;

moduleForAcceptance('unit - `MF.fragmentOwner` property', {
  beforeEach(assert) {
    owner = getOwner(this);
    store = owner.lookup('service:store');

    assert.expectNoDeprecation();
  },

  afterEach() {
    owner = null;
    store = null;
  }
});

test('fragments can reference their owner record', function(assert) {
  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Samwell',
            last: 'Tarly'
          }
        }
      }
    });

    return store.find('person', 1).then(person => {
      let name = person.get('name');

      assert.equal(name.get('person'), person, 'fragment owner property is reference to the owner record');
    });
  });
});

test('using a fragment owner property on a non-fragment throws an error', function(assert) {
  Ember.run(() => {
    let InvalidModel = DS.Model.extend({
      owner: MF.fragmentOwner()
    });

    owner.register('model:invalidModel', InvalidModel);

    let invalid = store.createRecord('invalidModel');

    assert.throws(() => {
      invalid.get('owner');
    }, /Fragment owner properties can only be used on fragments/, 'getting fragment owner on non-fragment throws an error');
  });
});

test('attempting to change a fragment\'s owner record throws an error', function(assert) {
  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Samwell',
            last: 'Tarly'
          }
        }
      }
    });

    store.push({
      data: {
        type: 'person',
        id: 2,
        attributes: {
          name: {
            first: 'Samwell',
            last: 'Tarly'
          }
        }
      }
    });

    return all([
      store.find('person', 1),
      store.find('person', 2)
    ]).then(people => {
      let name = people[0].get('name');

      assert.throws(() => {
        name.set('person', people[1]);
      }, 'setting the owner property throws an error');
    });
  });
});

test('fragment owner properties are notified of change', function(assert) {
  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Jeyne',
            last: 'Poole'
          }
        }
      }
    });

    return store.find('person', 1).then(person => {
      let name = store.createFragment('name', {
        first: 'Arya',
        last: 'Stark'
      });

      assert.ok(!name.get('person'), 'fragment owner property is null');

      person.set('name', name);

      assert.equal(name.get('person'), person, 'fragment owner property is updated');
    });
  });
});
