import EmberObject, { observer } from '@ember/object';
import { addObserver } from '@ember/object/observers';
import ObjectProxy from '@ember/object/proxy';
import { copy } from 'ember-copy';
import { run } from '@ember/runloop';
import MF from 'ember-data-model-fragments';
import DS from 'ember-data';
import { module, test, skip } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import Pretender from 'pretender';
let store, owner, server;

module('integration - Persistence', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function(assert) {
    owner = this.owner;
    store = owner.lookup('service:store');
    server = new Pretender();

    assert.expectNoDeprecation();
  });

  hooks.afterEach(function() {
    store = null;
    owner = null;
    server.shutdown();
  });

  test('persisting the owner record changes the fragment state to non-new', function(assert) {
    let data = {
      name: {
        first: 'Viserys',
        last: 'Targaryen'
      }
    };

    return run(() => {
      let person = store.createRecord('person');

      person.set('name', store.createFragment('name', data.name));

      let payload = {
        person: copy(data, true)
      };
      payload.person.id = 3;

      server.post('/people', () => {
        return [
          200,
          { 'Content-Type': 'application/json' },
          JSON.stringify(payload)
        ];
      });

      return person.save().then(person => {
        assert.ok(
          !person.get('name.isNew'),
          'fragments are not new after save'
        );
      });
    });
  });

  test('persisting the owner record in a clean state maintains clean state', function(assert) {
    return run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: 'Tyrion',
              last: 'Lannister'
            },
            addresses: [
              {
                street: '1 Sky Cell',
                city: 'Eyre',
                region: 'Vale of Arryn',
                country: 'Westeros'
              }
            ]
          }
        }
      });

      server.put('/people/1', () => {
        return [200, { 'Content-Type': 'application/json' }, '{}'];
      });

      return store
        .find('person', 1)
        .then(person => {
          return person.save();
        })
        .then(person => {
          let name = person.get('name');
          let addresses = person.get('addresses');

          assert.ok(!name.get('hasDirtyAttributes'), 'fragment is clean');
          assert.ok(
            !addresses.isAny('hasDirtyAttributes'),
            'all fragment array fragments are clean'
          );
          assert.ok(
            !addresses.get('hasDirtyAttributes'),
            'fragment array is clean'
          );
          assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
        });
    });
  });

  test('persisting the owner record when a fragment is dirty moves owner record, fragment array, and all fragments into clean state', function(assert) {
    return run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: 'Eddard',
              last: 'Stark'
            },
            addresses: [
              {
                street: '1 Great Keep',
                city: 'Winterfell',
                region: 'North',
                country: 'Westeros'
              }
            ]
          }
        }
      });

      server.put('/people/1', () => {
        return [200, { 'Content-Type': 'application/json' }, '{}'];
      });

      return store
        .find('person', 1)
        .then(person => {
          let name = person.get('name');
          let address = person.get('addresses.firstObject');

          name.set('first', 'Arya');
          address.set('street', '1 Godswood');

          return person.save();
        })
        .then(person => {
          let name = person.get('name');
          let addresses = person.get('addresses');
          let address = addresses.get('firstObject');

          assert.equal(name.get('first'), 'Arya', 'change is persisted');
          assert.equal(
            address.get('street'),
            '1 Godswood',
            'fragment array change is persisted'
          );
          assert.ok(!name.get('hasDirtyAttributes'), 'fragment is clean');
          assert.ok(
            !addresses.isAny('hasDirtyAttributes'),
            'all fragment array fragments are clean'
          );
          assert.ok(
            !addresses.get('hasDirtyAttributes'),
            'fragment array is clean'
          );
          assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
        });
    });
  });

  test('persisting a new owner record moves the owner record, fragment array, and all fragments into clean state', function(assert) {
    return run(() => {
      let data = {
        name: {
          first: 'Daenerys',
          last: 'Targaryen'
        },
        addresses: [
          store.createFragment('address', {
            street: '1 Stone Drum',
            city: 'Dragonstone',
            region: 'Crownlands',
            country: 'Westeros'
          })
        ]
      };

      let person = store.createRecord('person');
      person.set('name', store.createFragment('name', data.name));
      person.set('addresses', data.addresses);

      let payload = {
        person: copy(data, true)
      };
      payload.person.id = 3;

      server.post('/people', () => {
        return [
          200,
          { 'Content-Type': 'application/json' },
          JSON.stringify(payload)
        ];
      });

      return person.save().then(person => {
        let name = person.get('name');
        let addresses = person.get('addresses');

        assert.ok(!name.get('hasDirtyAttributes'), 'fragment is clean');
        assert.ok(
          !addresses.isAny('hasDirtyAttributes'),
          'all fragment array fragments are clean'
        );
        assert.ok(
          !addresses.get('hasDirtyAttributes'),
          'fragment array is clean'
        );
        assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
      });
    });
  });

  test('a new record can be persisted with null fragments', function(assert) {
    return run(() => {
      let person = store.createRecord('person');

      assert.equal(person.get('name'), null, 'fragment property is null');
      assert.equal(
        person.get('hobbies'),
        null,
        'fragment array property is null'
      );

      let payload = {
        person: {
          id: 1
        }
      };

      server.post('/people', () => {
        return [
          200,
          { 'Content-Type': 'application/json' },
          JSON.stringify(payload)
        ];
      });

      return person.save().then(person => {
        assert.equal(
          person.get('name'),
          null,
          'fragment property is still null'
        );
        assert.equal(
          person.get('hobbies'),
          null,
          'fragment array property is still null'
        );
        assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
      });
    });
  });

  test('the adapter can update fragments on save', async function(assert) {
    let data = {
      name: {
        first: 'Eddard',
        last: 'Stark'
      },
      addresses: [
        {
          street: '1 Great Keep',
          city: 'Winterfell',
          region: 'North',
          country: 'Westeros'
        }
      ]
    };

    let person = store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: data
      }
    });

    let payload = {
      person: copy(data, true)
    };
    payload.person.id = 1;
    payload.person.name.first = 'Ned';
    payload.person.addresses[0].street = '1 Godswood';

    server.put('/people/1', () => {
      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(payload)
      ];
    });

    await person.save();
    let name = person.get('name');
    let addresses = person.get('addresses');

    assert.ok(!name.get('hasDirtyAttributes'), 'fragment is clean');
    assert.ok(
      !addresses.isAny('hasDirtyAttributes'),
      'all fragment array fragments are clean'
    );
    assert.ok(
      !addresses.get('hasDirtyAttributes'),
      'fragment array is clean'
    );
    assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
    assert.equal(name.get('first'), 'Ned', 'fragment correctly updated');
    assert.equal(
      addresses.get('firstObject.street'),
      '1 Godswood',
      'fragment array fragment correctly updated'
    );
  });

  test('existing fragments are updated on save', function(assert) {
    let data = {
      name: {
        first: 'Eddard',
        last: 'Stark'
      },
      addresses: [
        {
          street: '1 Great Keep',
          city: 'Winterfell',
          region: 'North',
          country: 'Westeros'
        }
      ]
    };

    return run(() => {
      let payload = {
        person: copy(data, true)
      };

      payload.person.id = 1;
      payload.person.name.first = 'Ned';
      payload.person.addresses[0].street = '1 Godswood';
      payload.person.addresses.unshift({
        street: '1 Red Keep',
        city: 'Kings Landing',
        region: 'Crownlands',
        country: 'Westeros'
      });

      return run(() => {
        server.post('/people', () => {
          return [
            200,
            { 'Content-Type': 'application/json' },
            JSON.stringify(payload)
          ];
        });

        let person = store.createRecord('person');
        let name = store.createFragment('name', copy(data.name));
        let address = store.createFragment('address', copy(data.addresses[0]));

        person.set('name', name);
        person.set('addresses', [address]);

        let addresses = person.get('addresses');

        return person.save().then(() => {
          assert.equal(name.get('first'), 'Ned', 'fragment correctly updated');
          assert.equal(
            address.get('street'),
            '1 Red Keep',
            'fragment array fragment correctly updated'
          );
          assert.equal(
            addresses.get('lastObject.street'),
            '1 Godswood',
            'fragment array fragment correctly updated'
          );
          assert.equal(
            addresses.get('length'),
            2,
            'fragment array fragment correctly updated'
          );
        });
      });
    });
  });

  test('the adapter can update fragments on reload', function(assert) {
    let data = {
      name: {
        first: 'Brandon',
        last: 'Stark'
      },
      addresses: [
        {
          street: '1 Great Keep',
          city: 'Winterfell',
          region: 'North',
          country: 'Westeros'
        }
      ]
    };

    return run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: data
        }
      });

      let payload = {
        person: copy(data, true)
      };

      payload.person.id = 1;
      payload.person.name.first = 'Bran';
      payload.person.addresses[0].street = '1 Broken Tower';

      server.get('/people/1', () => {
        return [
          200,
          { 'Content-Type': 'application/json' },
          JSON.stringify(payload)
        ];
      });

      return store
        .find('person', 1)
        .then(person => {
          // Access values that will change to prime CP cache
          person.get('name.first');
          person.get('addresses.firstObject.street');

          return person.reload();
        })
        .then(person => {
          let name = person.get('name');
          let addresses = person.get('addresses');

          assert.equal(name.get('first'), 'Bran', 'fragment correctly updated');
          assert.equal(
            addresses.get('firstObject.street'),
            '1 Broken Tower',
            'fragment array fragment correctly updated'
          );
        });
    });
  });

  /*
    Currently in certain annoying cases in Ember, including aliases or proxies that are actively observed,
    CPs are consumed as soon as they are changed. If we are not careful, this can cause infinite loops when
    updating existing fragment data
  */
  test('the adapter can update fragments without infinite loops when CPs are eagerly consumed', function(assert) {
    let data = {
      name: {
        first: 'Brandon',
        last: 'Stark'
      }
    };

    return run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: data
        }
      });

      return store.find('person', 1).then(person => {
        let personProxy = ObjectProxy.create({ content: person });

        addObserver(personProxy, 'name.first', function() {});
        personProxy.get('name.first');

        store.push({
          data: {
            type: 'person',
            id: 1,
            attributes: data
          }
        });

        assert.equal(person.get('name.first'), 'Brandon');
      });
    });
  });

  // TODO: The data in the adapter response is not actually changing here, which
  // means that the property actually _shouldn't_ be notified. Doing so requires
  // value diffing of deserialized model data, which means either saving a copy of
  // the data before giving it to the fragment
  skip('fragment array properties are notified on save', function(assert) {
    // The extra assertion comes from deprecation checking
    // assert.expect(2);

    let data = {
      name: {
        first: 'Eddard',
        last: 'Stark'
      },
      addresses: [
        {
          street: '1 Great Keep',
          city: 'Winterfell',
          region: 'North',
          country: 'Westeros'
        }
      ]
    };

    let PersonObserver = EmberObject.extend({
      person: null,
      observer: observer('person.addresses.[]', function() {
        assert.ok(true, 'The array change was observed');
      })
    });

    return run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: data
        }
      });

      let payload = {
        person: copy(data, true)
      };
      payload.person.id = 1;

      server.put('/people/1', () => {
        return [
          200,
          { 'Content-Type': 'application/json' },
          JSON.stringify(payload)
        ];
      });

      return store.find('person', 1).then(person => {
        PersonObserver.create({ person: person });
        return person.save();
      });
    });
  });

  // TODO(igor) figure out why length is different the first time this assertion is called.
  skip('fragment array properties are notifed on reload', function(assert) {
    // The extra assertion comes from deprecation checking
    // assert.expect(2);
    let Army = DS.Model.extend({
      name: DS.attr('string'),
      soldiers: MF.array()
    });

    owner.register('model:army', Army);

    let data = {
      name: 'Golden Company',
      soldiers: ['Aegor Rivers', 'Jon Connington', 'Tristan Rivers']
    };

    let ArmyObserver = EmberObject.extend({
      army: null,
      observer: observer('army.soldiers.[]', function() {
        assert.equal(
          this.get('army.soldiers').length, 2,
          'The array change to was observed'
        );
      })
    });

    return run(() => {
      store.push({
        data: {
          type: 'army',
          id: 1,
          attributes: data
        }
      });

      let payload = {
        army: copy(data, true)
      };
      payload.army.id = 1;
      payload.army.soldiers.shift();

      server.get('/armies/1', () => {
        return [
          200,
          { 'Content-Type': 'application/json' },
          JSON.stringify(payload)
        ];
      });

      return store.find('army', 1).then(army => {
        ArmyObserver.create({ army: army });
        return army.reload();
      });
    });
  });

  test('string array can be rolled back on failed save', function(assert) {
    // assert.expect(3);

    let data = {
      name: 'Golden Company',
      soldiers: ['Aegor Rivers', 'Jon Connington', 'Tristan Rivers']
    };

    let Army = DS.Model.extend({
      name: DS.attr('string'),
      soldiers: MF.array()
    });

    owner.register('model:army', Army);

    return run(() => {
      store.push({
        data: {
          type: 'army',
          id: 1,
          attributes: data
        }
      });

      server.get('/armies', () => {
        return [500, { 'Content-Type': 'application/json' }];
      });

      let army, soliders;
      return store
        .find('army', 1)
        .then(_army => {
          army = _army;
          soliders = army.get('soldiers');
          soliders.pushObject('Lysono Maar');
          soliders.removeObject('Jon Connington');

          assert.deepEqual(soliders.toArray(), [
            'Aegor Rivers',
            'Tristan Rivers',
            'Lysono Maar'
          ]);

          return army.save();
        })
        .catch(() => {
          army.rollbackAttributes();

          assert.deepEqual(soliders.toArray(), [
            'Aegor Rivers',
            'Jon Connington',
            'Tristan Rivers'
          ]);
        });
    });
  });

  test('existing fragments can be rolled back on failed save', function(assert) {
    // assert.expect(3);

    let data = {
      name: {
        first: 'Eddard',
        last: 'Stark'
      },
      addresses: [
        {
          street: '1 Great Keep',
          city: 'Winterfell',
          region: 'North',
          country: 'Westeros'
        }
      ]
    };

    return run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: data
        }
      });

      server.put('/armies/1', () => {
        return [500, { 'Content-Type': 'application/json' }];
      });

      let mrStark, name, address;

      return store
        .find('person', 1)
        .then(person => {
          mrStark = person;

          name = mrStark.get('name');
          address = mrStark.get('addresses.firstObject');

          name.set('first', 'BadFirstName');
          name.set('last', 'BadLastName');
          address.set('street', 'BadStreet');

          return mrStark.save();
        })
        .catch(() => {
          mrStark.rollbackAttributes();

          assert.equal(
            `${name.get('first')} ${name.get('last')}`,
            'Eddard Stark',
            'fragment name rolled back'
          );
          assert.equal(
            address.get('street'),
            '1 Great Keep',
            'fragment array fragment correctly rolled back'
          );
        });
    });
  });

  test('setting an array does not error on save', function() {
    let Army = DS.Model.extend({
      soldiers: MF.array('string')
    });

    let data = {
      soldiers: ['Aegor Rivers', 'Jon Connington', 'Tristan Rivers']
    };
    let payload = {
      army: copy(data, true)
    };
    owner.register('model:army', Army);

    const army = run(() => store.createRecord('army'));
    server.post('/armies', () => {
      return [200, { 'Content-Type': 'application/json' },  JSON.stringify(payload)];
    });
    army.set('soldiers', ['Aegor Rivers', 'Jon Connington', 'Tristan Rivers']);
    run(() => army.save());
  });
});
