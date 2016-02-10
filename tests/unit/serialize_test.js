import Ember from 'ember';
import { test } from 'qunit';
import moduleForAcceptance from '../helpers/module-for-acceptance';
import JSONSerializer from 'ember-data/serializers/json';
import Person from 'dummy/models/person';
import MF from 'ember-data-model-fragments';
var store, application;

moduleForAcceptance("unit - Serialization", {
  beforeEach: function() {
    application = this.application;
    store = application.__container__.lookup('service:store');

    //expectNoDeprecation();

    // TODO: this is necessary to set `typeKey` and prevent `store#serializerFor` from blowing up
    store.modelFor('person');
  },

  afterEach: function() {
    application = null;
    store = null;
  }
});

test("fragment properties are snapshotted as normal attributes on the owner record snapshot", function(assert) {
  var person = {
    name: {
      first : "Catelyn",
      last  : "Stark"
    },
    houses: [
      {
        name   : "Tully",
        region : "Riverlands",
        exiled : true
      },
      {
        name   : "Stark",
        region : "North",
        exiled : true
      }
    ],
    children: [
      'Robb',
      'Sansa',
      'Arya',
      'Brandon',
      'Rickon'
    ]
  };

  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: person
      }
    });

    application.register('serializer:person', JSONSerializer.extend({
      serialize: function(snapshot) {
        var name = snapshot.attr('name');
        assert.ok(name instanceof DS.Snapshot, "fragment snapshot attribute is a snapshot");
        assert.equal(name.attr('first'), person.name.first, "fragment attributes are snapshoted correctly");

        var houses = snapshot.attr('houses');
        assert.ok(Array.isArray(houses), "fragment array attribute is an array");
        assert.ok(houses[0] instanceof DS.Snapshot, "fragment array attribute is an array of snapshots");
        assert.equal(houses[0].attr('name'), person.houses[0].name, "fragment array attributes are snapshotted correctly");

        var children = snapshot.attr('children');
        assert.ok(Array.isArray(children), "array attribute is an array");
        assert.deepEqual(children, person.children, "array attribute is snapshotted correctly");
      }
    }));

    return store.find('person', 1).then(function(person) {
      person.serialize();
    });
  });
});

test("fragment properties are serialized as normal attributes using their own serializers", function(assert) {
  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: "Aerys",
            last: "Targaryen"
          }
        }
      }
    });

    application.register('serializer:name', JSONSerializer.extend({
      serialize: function() {
        return 'Mad King';
      }
    }));

    return store.find('person', 1).then(function(person) {
      var serialized = person.serialize();

      assert.equal(serialized.name, 'Mad King', "serialization uses result from `fragment#serialize`");
    });
  });
});

test("serializing a fragment array creates a new array with contents the result of serializing each fragment", function(assert) {
  var names = [
    {
      first: "Rhaegar",
      last: "Targaryen"
    },
    {
      first: "Viserys",
      last: "Targaryen"
    },
    {
      first: "Daenerys",
      last: "Targaryen"
    }
  ];

  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          names: names
        }
      }
    });

    application.register('serializer:name', JSONSerializer);

    return store.find('person', 1).then(function(person) {
      var serialized = person.serialize();

      assert.deepEqual(serialized.names, names, "serializing returns array of each fragment serialized");
    });
  });
});

test("normalizing data can handle `null` fragment values", function(assert) {
  var NullDefaultPerson = Person.extend({
    houses: MF.fragmentArray('house', { defaultValue: null }),
    children: MF.array({ defaultValue: null })
  });

  application.register('model:nullDefaultPerson', NullDefaultPerson);

  var normalized = store.normalize('nullDefaultPerson', {
    name: null,
    houses: null,
    children: null
  });

  var attributes = normalized.data.attributes;

  assert.strictEqual(attributes.name, null, "fragment property values can be null");
  assert.strictEqual(attributes.houses, null, "fragment array property values can be null");
  assert.strictEqual(attributes.children, null, "`array property values can be null");
});

test("normalizing data can handle `null` fragment values", function(assert) {
  var NullDefaultPerson = Person.extend({
    houses: MF.fragmentArray('house', { defaultValue: null }),
    children: MF.array({ defaultValue: null })
  });

  application.register('model:nullDefaultPerson', NullDefaultPerson);

  Ember.run(() => {
    store.push({
      data: {
        type: 'NullDefaultPerson',
        id: 1,
        attributes: {
          name: null,
          houses: null,
          children: null
        }
      }
    });

    return store.find('nullDefaultPerson', 1).then(function(person) {
      var serialized = person.serialize();

      assert.strictEqual(serialized.name, null, "fragment property values can be null");
      assert.strictEqual(serialized.houses, null, "fragment array property values can be null");
      assert.strictEqual(serialized.children, null, "`array property values can be null");
    });
  });
});

test("array properties use the specified transform to normalize data", function(assert) {
  var values = [ 1, 0, true, false, 'true', '' ];

  var normalized = store.normalize('person', {
    strings: values,
    numbers: values,
    booleans: values
  });

  var attributes = normalized.data.attributes;

  assert.ok(values.every(function(value, index) {
    return attributes.strings[index] === String(value) &&
      attributes.numbers[index] === (Ember.isEmpty(value) || isNaN(Number(value)) ? null : Number(value)) &&
      attributes.booleans[index] === Boolean(value);
  }), "fragment property values are normalized");
});

test("array properties use the specified transform to serialize data", function(assert) {
  var values = [ 1, 0, true, false, 'true', '' ];

  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          strings: values,
          numbers: values,
          booleans: values
        }
      }
    });

    return store.find('person', 1).then(function(person) {
      var serialized = person.serialize();

      assert.ok(values.every(function(value, index) {
        return serialized.strings[index] === String(value) &&
          serialized.numbers[index] === (Ember.isEmpty(value) || isNaN(Number(value)) ? null : Number(value)) &&
          serialized.booleans[index] === Boolean(value);
      }), "fragment property values are normalized");
    });
  });
});
