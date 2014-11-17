# Ember Data: Model Fragments [![Build Status](https://travis-ci.org/lytics/ember-data.model-fragments.svg)](https://travis-ci.org/lytics/ember-data.model-fragments)

This package provides support for sub-models that can be treated much like `belongsTo` and `hasMany` relationships are, but whose persistence is managed completely through the parent object.

## Example

```javascript
App.Person = DS.Model.extend({
  name      : DS.hasOneFragment('name'),
  addresses : DS.hasManyFragments('address'),
  titles    : DS.hasManyFragments()
});

App.Name = DS.ModelFragment.extend({
  first : DS.attr('string'),
  last  : DS.attr('string')
});

App.Address = DS.ModelFragment.extend({
  street  : DS.attr('string'),
  city    : DS.attr('string'),
  region  : DS.attr('string'),
  country : DS.attr('string')
});
```

With a JSON payload of:

```json
{
  "id": "1",
  "name": {
    "first": "Tyrion",
    "last": "Lannister"
  },
  "addresses": [
    {
      "street": "1 Sky Cell",
      "city": "Eyre",
      "region": "Vale of Arryn",
      "country": "Westeros"
    },
    {
      "street": "1 Tower of the Hand",
      "city": "King's Landing",
      "region": "Crownlands",
      "country": "Westeros"
    }
  ],
  "titles": [ "Imp", "Hand of the King" ]
}
```

The `name` attribute can be treated similar to a `belongsTo` relationship:

```javascript
var person = store.getById('person', '1');
var name = person.get('name');

person.get('isDirty'); // false
name.get('first'); // 'Tyrion'

name.set('first', 'Jamie');
person.get('isDirty'); // true

person.rollback();
name.get('first'); // 'Tyrion'

// New fragments are created through the store and assigned directly
person.set('name', store.createFragment('name', {
  first : 'Hugor',
  last  : 'Hill'
}));
person.get('isDirty'); // true
```

The `addresses` attribute can be treated similar to a `hasMany` relationship:

```javascript
var person = store.getById('person', '1');
var addresses = person.get('addresses');
var address = addresses.get('lastObject');

person.get('isDirty'); // false
address.get('country'); // 'Westeros'

address.set('country', 'Essos');
person.get('isDirty'); // true

person.rollback();
address.get('country'); // 'Westeros'

// Fragments can be created and added directly through the fragment array
addresses.get('length'); // 2
addresses.createFragment({
  street  : '1 Shy Maid',
  city    : 'Rhoyne River',
  region  : 'Free Cities',
  country : 'Essos'
});
addresses.get('length'); // 3
person.get('isDirty'); // true
```

The `titles` attribute can be treated as an `Ember.Array`:

```javascript
var person = store.getById('person', '1');
var titles = person.get('titles');

person.get('isDirty'); // false
titles.get('length'); // 2

titles.pushObject('Halfman');
titles.get('length'); // 3
person.get('isDirty'); // true

person.rollback();
titles.get('length'); // 2
```

## Nesting

Nesting of fragments is fully supported:

```javascript
App.User = DS.Model.extend({
  name   : DS.attr('string'),
  orders : DS.hasManyFragments('order')
});

App.Order = DS.ModelFragment.extend({
  amount   : DS.attr('string'),
  products : DS.hasManyFragments('product')
});

App.Product = DS.ModelFragment.extend({
  name  : DS.attr('string'),
  sku   : DS.attr('string'),
  price : DS.attr('string')
});
```

With a JSON payload of:

```json
{
  "id": "1",
  "name": "Tyrion Lannister",
  "orders": [
    {
      "amount": "799.98",
      "products" : [
        {
          "name": "Tears of Lys",
          "sku": "poison-bd-32",
          "price": "499.99"
        },
        {
          "name": "The Strangler",
          "sku": "poison-md-24",
          "price": "299.99"
        }
      ]
    },
    {
      "amount": "10999.99",
      "products": [
        {
          "name": "Lives of Four Kings",
          "sku": "old-book-32",
          "price": "10999.99"
        }
      ]
    }
  ]
}
```

Dirty state propagates up to the parent record, rollback cascades down:

```javascript
var user = store.getById('user', '1');
var product = user.get('orders.firstObject.products.lastObject');

user.get('isDirty'); // false
product.get('price'); // '299.99'

product.set('price', '1.99');
user.get('isDirty'); // true

user.rollback();
user.get('isDirty'); // false
product.get('price'); // '299.99'
```

However, note that fragments do not currently support `DS.belongsTo` or `DS.hasMany` properties. See the [Limitations](#relationships-to-models) section below.

## Polymorphism

Ember Data: Model Fragments has support for *reading* polymorphic fragments. To use this feature, pass an options object to `hasOneFragment` or `hasManyFragments`
with `polymorphic` set to true. In addition the `typeKey` can be set, which defaults to `'type'`.

The `typeKey`'s value must be the lowercase name of a class that is assignment-compatible to the declared type of the fragment attribute. That is, it must be the declared type itself or a subclass.

In the following example the declared type of `animals` is `animal`, which corresponds to the class `App.Animal`. `App.Animal` has two subclasses: `App.Elephant` and `App.Lion`,
so to `typeKey`'s value can be `'animal'`, `'elephant'` or `'lion'`.

```javascript
App.Zoo = DS.Model.extend({
  name: DS.attr("string"),
  city: DS.attr("string"),
  animals: DS.hasManyFragments("animal", { polymorphic: true, typeKey: '$type' }),
});

App.Animal = DS.ModelFragment.extend({
  name: DS.attr("string"),
});

App.Elephant = Animal.extend({
  trunkLength: DS.attr("number"),
});

App.Lion = Animal.extend({
  hasManes: DS.attr("boolean"),
});
```

The expected JSON payload is as follows:
```json
{
  "Zoo" : {
    "id" : "1",
    "name" : "Winterfell Zoo",
    "city" : "Winterfell",
    "animals" : [
      {
        "$type" : "lion",
        "name" : "Simba",
        "hasManes" : false
      },
      {
        "$type" : "lion",
        "name" : "Leonard",
        "hasManes" : true
      },
      {
        "$type" : "elephant",
        "name" : "Trunky",
        "trunkLength" : 10
      },
      {
        "$type" : "elephant",
        "name" : "Snuffles",
        "trunkLength" : 9
      }
    ]
  }
}
```

Serializing the fragment type back to JSON is not currently supported out of the box. To serialize the polymorphic type, create a custom serializer to perform manual introspection:

```javascript
App.AnimalSerializer = DS.JSONSerializer.extend({
  serialize: function(record, options) {
    var json = this._super(record, options);

    if (record instanceof App.Elephant) {
      json.$type = 'elephant';
    } else if (record instanceof App.Lion) {
      json.$type = 'lion';
    } else {
      json.$type = 'animal';
    }

    return json;
  }
});

App.ElephantSerializer = App.AnimalSerializer;
App.LionSerializer = App.AnimalSerializer;
```

## Limitations

### Conflict Resolution

There is a very good reason that support for id-less embedded records has not been added to Ember Data: merging conflicts is very difficult. Imagine a scenario where your app requests a record with an array of simple embedded objects, and then a minute later makes the same request again. If the array of objects has changed – for instance an object is added to the beginning – without unique identifiers there is no reliable way to map those objects onto the array of records in memory.

This plugin handles merging fragment arrays *by swapping out the data of existing fragments*. For example, when a record is fetched with a fragment array property, a fragment model is created for each object in the array. Then, after the record is reloaded via `reload` or `save`, the data received is mapped directly onto those existing fragment instances, adding or removing from the end when necessary. This means that reordering the array will cause fragment objects' data to swap, rather than simply reordering the array of fragments in memory. The biggest implication of this behavior is when a fragment in a fragment array is dirty and the parent model gets reloaded. If the record is then saved, the change will likely affect the wrong object, causing data loss. Additionally, any time a reference to a model fragment is held onto, reloading can give it a completely different semantic meaning. If your app does not persist models with fragment arrays, this is of no concern (and indeed you may wish to use the `DS.EmbeddedRecordMixin` instead).

### Filtered Record Arrays

Another consequence of id-less records is that an ID map of all fragment instances of a given type is not possible. This means no `store.all('<fragment_type>')`, and no ability to display all known fragments (e.g. names or addresses) without iterating over all owner records and manually building a list.

### Relationships to Models

Currently, fragments cannot have normal `DS.belongsTo` or `DS.hasMany` relationships. This is not a technical limitation, but rather due to the fact that relationship management in Ember Data is in a state of flux and would require accessing private (and changing) APIs.

## Testing

Building requires [Grunt](http://gruntjs.com/) and running tests requires [Test 'Em](https://github.com/airportyh/testem), which can both be installed globally with:

```sh
$ npm install --global grunt testem
```

Then install NPM packages, build the plugin, and start the development test server:

```sh
$ npm install
$ grunt build
$ testem
```

## Contributing

When reporting an issue, follow the [Ember guidelines](https://github.com/emberjs/ember.js/blob/master/CONTRIBUTING.md#reporting-a-bug). When contributing features, follow [Github guidelines](https://help.github.com/articles/fork-a-repo) for forking and creating a new pull request. All existing tests must pass (or be suitably modified), and all new features must be accompanied by tests to be considered.
