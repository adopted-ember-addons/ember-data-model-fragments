# Ember Data: Model Fragments

[![Build Status](https://travis-ci.org/lytics/ember-data.model-fragments.svg)](https://travis-ci.org/lytics/ember-data.model-fragments)
[![NPM Version](https://badge.fury.io/js/ember-data-model-fragments.svg)](http://badge.fury.io/js/ember-data-model-fragments)
[![Ember Observer Score](http://emberobserver.com/badges/ember-data-model-fragments.svg)](http://emberobserver.com/addons/ember-data-model-fragments)

This package provides support for sub-models that can be treated much like `belongsTo` and `hasMany` relationships are, but whose persistence is managed completely through the parent object.


:warning: Ember Data v1.0.0-beta.12 introduced a bug that makes it incompatible with any version of this project.

:warning: Ember Data v1.0.0-beta.15 introduced a breaking change to the serializer API with [Snapshots](https://github.com/emberjs/data/pull/2623). Since this affected fragment serialization as well, support for it was added in v0.3.0. See the [serializing](#serializing) section below for more information.

:warning: Ember Data v1.0.0-beta.19 refactored a large number of internal APIs this project relied on and is not officially supported. Compatibility was added in v0.4.0 and targeted at Ember Data v1.13.x.

Use the following table to decide which version of this project to use with your app:

| Ember Data | Model Fragments |
|------------|-----------------|
| > v1.0.0-beta.7 <= v1.0.0-beta.11 | v0.2.3 |
| v1.0.0-beta.14 | v0.2.8 |
| >= v1.0.0-beta.15 <= v1.0.0-beta.18 | v0.3.3 |
| >= v1.13.x | >= v0.4.0 |

## Installation

To install as an Ember CLI addon:

```sh
$ ember install ember-data-model-fragments
```

You may then start creating fragments with:

```sh
$ ember generate fragment foo someAttr:string anotherAttr:boolean
```

Which will create the module `app/models/foo.js` which exports a `DS.ModelFragment` class with the given attributes.

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

## Default Values

Ember Data attributes [support a `defaultValue` config option](http://emberjs.com/api/data/classes/DS.html#method_attr) that provides a default value when a model is created through `store#createRecord()`. Similarly, `DS.hasOneFragment` and `DS.hasManyFragments` properties support a `defaultValue` option:

```javascript
App.Person = DS.Model.extend({
  name      : DS.hasOneFragment('name', { defaultValue: { first: 'Faceless', last: 'Man' } }),
  addresses : DS.hasManyFragments('address', { defaultValue: [] }),
  titles    : DS.hasManyFragments(null, { defaultValue: [] })
});
```

Since JavaScript objects and arrays are passed by reference, the value of `defaultValue` is copied using `Ember.copy` in order to prevent all instances sharing the same value. If a `defaultValue` option is not specified, both `DS.hasOneFragment` and `DS.hasManyFragments` properties will default to `null`. Note that this may cause confusion when creating a record with a `DS.hasManyFragments` property:

```javascript
var person = store.createRecord('person');
var addresses = person.get('addresses'); // null

// Fails with "Cannot read property 'createFragment' of null"
addresses.createFragment({
  ...
});
```

Like `DS.attr`, the `defaultValue` option can be a function that is invoked to generate the default value:

```javascript
App.Person = DS.Model.extend({
  name: DS.hasOneFragment('name', {
    defaultValue: function() {
      return {
        first: 'Unsullied',
        last: Ember.uuid()
      }
    }
  })
});
```
## Serializing

Serializing records with fragment attributes works using a special `DS.Transform` that serializes each fragment or fragment array. This results in fragments being nested in JSON as expected, and avoids the need for any custom serialization logic for most cases. This also means that model fragments can have their own custom serializers, just as normal models can:

```javascript
App.Name = DS.ModelFragment.extend({
  given  : DS.attr('string'),
  family : DS.attr('string')
});

// Serializers for fragments work just as with models
App.NameSerializer = DS.JSONSerializer.extend({
  attrs: {
    given  : 'first',
    family : 'last'
  }
});
```

If custom serialization of the owner record is needed, fragment [snapshots](http://emberjs.com/api/data/classes/DS.Snapshot.html) can be accessed using the [`Snapshot#attr`](http://emberjs.com/api/data/classes/DS.Snapshot.html#method_attr) method. Note that this differs from how relationships are accessed on snapshots (using `belongsTo`/`hasMany` methods):

```javascript
// Fragment snapshots are accessed using `snapshot.attr()`
App.PersonSerializer = DS.JSONSerializer.extend({
  serialize: function(snapshot, options) {
    var json = this._super(snapshot, options);

    // Returns a `DS.Snapshot` instance of the fragment
    var nameSnapshot = snapshot.attr('name');

    json.full_name = nameSnapshot.attr('given') + ' ' + nameSnapshot.attr('family');

    // Returns a plain array of `DS.Snapshot` instances
    var addressSnapshots = snapshot.attr('addresses');

    json.countries = addressSnapshots.map(function(addressSnapshot) {
      return addressSnapshot.attr('country');
    });

    // Returns a plain array of primitives
    var titlesSnapshot = snapshot.attr('titles');

    json.title_count = titlesSnapshot.length;

    return json;
  }
});
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

Building requires [Ember CLI](http://www.ember-cli.com/) and running tests requires [Test 'Em](https://github.com/airportyh/testem) and [Bower](http://bower.io/), which can all be installed globally with:

```sh
$ npm install --global ember-cli bower testem
```

Then install NPM & Bower packages, build the project, and start the development test server:

```sh
$ npm install && bower install
$ ember build
$ testem
```

If you encounter test errors, ensure that your global testem NPM package is up to date.

When developing, it is often convenient to build the project with `ember serve` which will watch for file changes and rebuild, which triggers the test runner to re-run tests. A production build with debugging aids stripped out can also be made by running:

```sh
$ ember build --environment=production
```

## Contributing

When reporting an issue, follow the [Ember guidelines](https://github.com/emberjs/ember.js/blob/master/CONTRIBUTING.md#reporting-a-bug). When contributing features, follow [Github guidelines](https://help.github.com/articles/fork-a-repo) for forking and creating a new pull request. All existing tests must pass (or be suitably modified), and all new features must be accompanied by tests to be considered.
