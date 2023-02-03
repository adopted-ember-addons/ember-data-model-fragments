# Ember Data Model Fragments

[![CI](https://github.com/adopted-ember-addons/ember-data-model-fragments/actions/workflows/ci.yml/badge.svg)](https://github.com/adopted-ember-addons/ember-data-model-fragments/actions/workflows/ci.yml)
[![NPM Version](https://badge.fury.io/js/ember-data-model-fragments.svg)](http://badge.fury.io/js/ember-data-model-fragments)
[![Ember Observer Score](http://emberobserver.com/badges/ember-data-model-fragments.svg)](http://emberobserver.com/addons/ember-data-model-fragments)

This package provides support for sub-models that can be treated much like `belongsTo` and `hasMany` relationships are, but whose persistence is managed completely through the parent object.

:warning: Deprecated APIs have been removed. See the [changelog](CHANGELOG.md) for more information on breaking changes.

## Compatibility

This project makes extensive use of private Ember Data APIs and is therefore sensitive to minor changes in new Ember Data releases, regardless of semver guarantees. Every effort is made to maintain compatibility with the latest version, but updates always take time. See the [contributing](#contributing) section if you'd like to help out :shipit:

Use the following table to decide which version of this project to use with your app:

| Ember Data | Model Fragments |
|------------|-----------------|
| >= v3.5.x < v3.12.x | v4.0.x |
| >= v3.13.x | v5.0.x |
| >= v3.28.x | Not fully compatible (See [issue](https://github.com/adopted-ember-addons/ember-data-model-fragments/issues/406)) |

#### Notes

- Ember Data 3.5 added `RecordData` interfaces. See: [#324](https://github.com/lytics/ember-data-model-fragments/pull/324), [emberjs/rfcs#293](https://github.com/emberjs/rfcs/pull/293), and [emberjs/data#5616](https://github.com/emberjs/data/pull/5616).
- Ember Data 3.13 changed `InternalModel` Private APIs. See: [#360] (https://github.com/lytics/ember-data-model-fragments/pull/360)

## Installation

To install as an Ember CLI addon:

```sh
$ ember install ember-data-model-fragments
```

You may then start creating fragments with:

```sh
$ ember generate fragment foo someAttr:string anotherAttr:boolean
```

Which will create the module `app/models/foo.js` which exports a `Fragment` class with the given attributes.

You might also want to take a look at [FEDITOR's Ember Data model generator](http://feditor.tech/content/gist/6478b5134893399879c0), which can generate `Model` and `Fragment` classes based on your API's JSON response.

## Example

```javascript
// app/models/person.js

import Model from '@ember-data/model';
import {
  fragment,
  fragmentArray,
  array
} from 'ember-data-model-fragments/attributes';

export default class PersonModel extends Model {
  @fragment('name') name;
  @fragmentArray('address') addresses;
  @array() titles;
}
```

```javascript
// app/models/name.js

import Fragment from 'ember-data-model-fragments/fragment';
import { attr } from '@ember-data/model';

export default class NameFragment extends Fragment {
  @attr('string') first;
  @attr('string') last;
}
```

```javascript
// app/models/address.js

import Fragment from 'ember-data-model-fragments/fragment';
import { attr } from '@ember-data/model';

export default class AddressFragment extends Fragment {
  @attr('string') street;
  @attr('string') city;
  @attr('string') region;
  @attr('string') country;
}
```

With a JSON payload of:

```json
{
  "person": {
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
    "titles": ["Imp", "Hand of the King"]
  }
}
```

The `name` attribute can be treated similar to a `belongsTo` relationship:

```javascript
const person = store.peekRecord('person', '1');
const name = person.get('name');

person.get('hasDirtyAttributes'); // false
name.get('first'); // 'Tyrion'

name.set('first', 'Jamie');
person.get('hasDirtyAttributes'); // true

person.rollbackAttributes();
name.get('first'); // 'Tyrion'

// New fragments are created through the store and assigned directly
person.set(
  'name',
  store.createFragment('name', {
    first: 'Hugor',
    last: 'Hill',
  })
);
person.get('hasDirtyAttributes'); // true

// Fragments can also be set with hashes
person.set('name', {
  first: 'Tyrion',
  last: 'Lannister',
});
person.get('hasDirtyAttributes'); // false
```

The `addresses` attribute can be treated similar to a `hasMany` relationship:

```javascript
const person = store.peekRecord('person', '1');
const addresses = person.get('addresses');
const address = addresses.get('lastObject');

person.get('hasDirtyAttributes'); // false
address.get('country'); // 'Westeros'

address.set('country', 'Essos');
person.get('hasDirtyAttributes'); // true

person.rollbackAttributes();
address.get('country'); // 'Westeros'

// Fragments can be created and added directly through the fragment array
addresses.get('length'); // 2
addresses.createFragment({
  street: '1 Shy Maid',
  city: 'Rhoyne River',
  region: 'Free Cities',
  country: 'Essos',
});
addresses.get('length'); // 3
person.get('hasDirtyAttributes'); // true

// Or with arrays of objects
person.set('addresses', [
  {
    street: '1 Great Pyramid',
    city: 'Meereen',
    region: "Slaver's Bay",
    country: 'Essos',
  },
]);
```

The `titles` attribute can be treated as an `Ember.Array`:

```javascript
const person = store.peekRecord('person', '1');
const titles = person.get('titles');

person.get('hasDirtyAttributes'); // false
titles.get('length'); // 2

titles.pushObject('Halfman');
titles.get('length'); // 3
person.get('hasDirtyAttributes'); // true

person.rollbackAttributes();
titles.get('length'); // 2
```

## Default Values

Ember Data attributes [support a `defaultValue` config option](http://emberjs.com/api/data/classes/DS.html#method_attr) that provides a default value when a model is created through `store#createRecord()`. Similarly, `fragment` and `fragmentArray` properties support a `defaultValue` option:

```javascript
// app/models/person.js

import Model from '@ember-data/model';
import {
  fragment,
  fragmentArray,
  array
} from 'ember-data-model-fragments/attributes';

export default class PersonModel extends Model {
  @fragment('name', { defaultValue: { first: 'Faceless', last: 'Man' } }) name;
  @fragmentArray('address') addresses;
  @array('string') titles;
}
```

Since JavaScript objects and arrays are passed by reference, the value of `defaultValue` is copied using `Ember.copy` in order to prevent all instances sharing the same value. If a `defaultValue` option is not specified, `fragment` properties default to `null` and `fragmentArray` properties default to an empty array. Note that this may cause confusion when creating a record with a `fragmentArray` property:

```javascript
const person = store.createRecord('person');
const addresses = person.get('addresses'); // null

// Fails with "Cannot read property 'createFragment' of null"
addresses.createFragment({
  ...
});
```

Like `attr`, the `defaultValue` option can be a function that is invoked to generate the default value:

```javascript
// app/models/person.js

import Model from '@ember-data/model';
import { fragment } from 'ember-data-model-fragments/attributes';

export default class PersonModel extends Model {
  @fragment('name', {
    defaultValue() {
      return {
        first: 'Unsullied',
        last: new Date().toString(),
      };
    }
  }) name;
}
```
## Serializing

Serializing records with fragment attributes works using a special `Transform` that serializes each fragment or fragment array. This results in fragments being nested in JSON as expected, and avoids the need for any custom serialization logic for most cases. This also means that model fragments can have their own custom serializers, just as normal models can:

```javascript
// app/models/name.js

import Fragment from 'ember-data-model-fragments/fragment';
import { attr } from '@ember-data/model';

export default class NameFragment extends Fragment {
  @attr('string') given;
  @attr('string') family;
}
```

```javascript
// apps/serializers/name.js
// Serializers for fragments work just as with models

import JSONSerializer from '@ember-data/serializer/json';

export default class NameSerializer extends JSONSerializer {
  attrs = {
    given: 'first',
    family: 'last',
  };
}
```

Since fragment deserialization uses the value of a single attribute in the parent model, the `normalizeResponse` method of the serializer is never used. And since the attribute value is not a full-fledged [JSON API](http://jsonapi.org/) response, `JSONAPISerializer` cannot be used with fragments. Because of this, auto-generated fragment serializers **do not use the application serializer** and instead use `JSONSerializer`.

If common logic must be added to auto-generated fragment serializers, apps can register a custom `serializer:-fragment` with the application in an initializer.

```javascript
// app/serializers/fragment.js

import JSONSerializer from '@ember-data/serializer/json';

export default class FragmentSerializer extends JSONSerializer {}
```

```javascript
// app/initializers/fragment-serializer.js

import FragmentSerializer from '../serializers/fragment';

export function initialize(application) {
  application.register('serializer:-fragment', FragmentSerializer);
}

export default {
  name: 'fragment-serializer',
  initialize: initialize,
};
```

If custom serialization of the owner record is needed, fragment [snapshots](http://emberjs.com/api/data/classes/DS.Snapshot.html) can be accessed using the [`Snapshot#attr`](http://emberjs.com/api/data/classes/DS.Snapshot.html#method_attr) method. Note that this differs from how relationships are accessed on snapshots (using `belongsTo`/`hasMany` methods):

```javascript
// apps/serializers/person.js
// Fragment snapshots are accessed using `snapshot.attr()`

import JSONSerializer from '@ember-data/serializer/json';

export default JSONSerializer.extend({
  serialize(snapshot, options) {
    const json = super.serialize(...arguments);

    // Returns a `Snapshot` instance of the fragment
    const nameSnapshot = snapshot.attr('name');

    json.full_name = nameSnapshot.attr('given') + ' ' + nameSnapshot.attr('family');

    // Returns a plain array of `Snapshot` instances
    const addressSnapshots = snapshot.attr('addresses');

    json.countries = addressSnapshots.map(function(addressSnapshot) {
      return addressSnapshot.attr('country');
    });

    // Returns a plain array of primitives
    const titlesSnapshot = snapshot.attr('titles');

    json.title_count = titlesSnapshot.length;

    return json;
  }
});
```

## Nesting

Nesting of fragments is fully supported:

```javascript
// app/models/user.js

import Model, { attr } from '@ember-data/model';
import { fragmentArray } from 'ember-data-model-fragments/attributes';

export default class UserModel extends Model {
  @attr('string') name;
  @fragmentArray('order') orders;
}
```

```javascript
// app/models/order.js

import Fragment from 'ember-data-model-fragments/fragment';
import { attr } from '@ember-data/model';
import { fragmentArray } from 'ember-data-model-fragments/attributes';

export default class OrderFragment extends Fragment {
  @attr('string') amount;
  @fragmentArray('product') products;
}
```

```javascript
// app/models/product.js

import Fragment from 'ember-data-model-fragments/fragment';
import { attr } from '@ember-data/model';

export default class ProductFragment extends Fragment {
  @attr('string') name;
  @attr('string') sku;
  @attr('string') price;
}
```

With a JSON payload of:

```json
{
  "id": "1",
  "name": "Tyrion Lannister",
  "orders": [
    {
      "amount": "799.98",
      "products": [
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
const user = store.peekRecord('user', '1');
const product = user.get('orders.firstObject.products.lastObject');

user.get('hasDirtyAttributes'); // false
product.get('price'); // '299.99'

product.set('price', '1.99');
user.get('hasDirtyAttributes'); // true

user.rollbackAttributes();
user.get('hasDirtyAttributes'); // false
product.get('price'); // '299.99'
```

However, note that fragments do not currently support `belongsTo` or `hasMany` properties. See the [Limitations](#relationships-to-models) section below.

## Polymorphism

Ember Data: Model Fragments has support for *reading* polymorphic fragments. To use this feature, pass an options object to `fragment` or `fragmentArray`
with `polymorphic` set to true. In addition the `typeKey` can be set, which defaults to `'type'`.

The `typeKey` option might be a `String` or a `Function` returning a `String`. If you use a function, the `data` and the `owner` will be passed as parameter.

The `typeKey`'s value must be the lowercase name of a class that is assignment-compatible to the declared type of the fragment attribute. That is, it must be the declared type itself or a subclass. Additionally, the `typeKey`'s value must be a field on the parent class.

In the following example the declared type of `animals` is `animal`, which corresponds to the class `Animal`. `Animal` has two subclasses: `Elephant` and `Lion`,
so to `typeKey`'s value can be `'animal'`, `'elephant'` or `'lion'`.

```javascript
// app/models/zoo.js

import Model, { attr } from '@ember-data/model';
import { fragment, fragmentArray } from 'ember-data-model-fragments/attributes';

export default class ZooModel extends Model {
  @attr('string') name;
  @attr('string') city;
  @fragmentArray('animal', { polymorphic: true, typeKey: '$type' }) animals;
  @fragment('animal', { polymorphic: true, typeKey: (data) => `my-model-prefix-${data.name}` }) bestAnimal;
}
```

```javascript
// app/models/animal.js

import Fragment from 'ember-data-model-fragments/fragment';
import { attr } from '@ember-data/model';

export default class AnimalFragment extends Fragment {
  @attr('string') $type;
  @attr('string') name;
}
```

```javascript
// app/models/elephant.js

import AnimalFragment from './animal';
import { attr } from '@ember-data/model';

export default class ElephantFragment extends AnimalFragment {
  @attr('number') trunkLength;
}
```

```javascript
// app/models/lion.js

import AnimalFragment from './animal';
import { attr } from '@ember-data/model';

export default class LionFragment extends AnimalFragment {
  @attr('boolean') hasManes;
}
```

The expected JSON payload is as follows:
```json
{
  "Zoo": {
    "id": "1",
    "name": "Winterfell Zoo",
    "city": "Winterfell",
    "animals": [
      {
        "$type": "lion",
        "name": "Simba",
        "hasManes": false
      },
      {
        "$type": "lion",
        "name": "Leonard",
        "hasManes": true
      },
      {
        "$type": "elephant",
        "name": "Trunky",
        "trunkLength": 10
      },
      {
        "$type": "elephant",
        "name": "Snuffles",
        "trunkLength": 9
      }
    ]
  }
}
```

Serializing the fragment type back to JSON is not currently supported out of the box. To serialize the polymorphic type, create a custom serializer to perform manual introspection:

```javascript
// app/serializers/animal.js

import JSONSerializer from '@ember-data/serializer/json';
import ElephantFragment from 'app/models/elephant';
import LionFragment from 'app/models/elephant';

export default class AnimalSerializer extends JSONSerializer {
  serialize(record, options) {
    const json = super.serialize(...arguments);

    if (record instanceof ElephantFragment) {
      json.$type = 'elephant';
    } else if (record instanceof LionFragment) {
      json.$type = 'lion';
    } else {
      json.$type = 'animal';
    }

    return json;
  }
}
```

```javascript
// app/serializers/elephant.js

import AnimalSerializer from './animal';

export default AnimalSerializer;
```

```javascript
// app/serializers/lion.js

import AnimalSerializer from './animal';

export default AnimalSerializer;
```

## TypeScript

TypeScript declarations are included out of the box. For additional type safety for `createFragment`, `push`, etc. you can index your fragment classes in the `FragmentRegistry`:

```typescript
// app/models/address.ts

import Fragment from 'ember-data-model-fragments/fragment';
import { attr } from '@ember-data/model';

export default class AddressFragment extends Fragment {
  @attr('string')
  declare street: string;

  @attr('string')
  declare city: string;

  @attr('string')
  declare region: string;

  @attr('string')
  declare country: string;
}

declare module 'ember-data-model-fragments/types/registries/fragment' {
  export default interface FragmentRegistry {
    address: AddressFragment;
  }
}
```

## Limitations

### Conflict Resolution

There is a very good reason that support for id-less embedded records has not been added to Ember Data: merging conflicts is very difficult. Imagine a scenario where your app requests a record with an array of simple embedded objects, and then a minute later makes the same request again. If the array of objects has changed – for instance an object is added to the beginning – without unique identifiers there is no reliable way to map those objects onto the array of records in memory.

This plugin handles merging fragment arrays *by swapping out the data of existing fragments*. For example, when a record is fetched with a fragment array property, a fragment model is created for each object in the array. Then, after the record is reloaded via `reload` or `save`, the data received is mapped directly onto those existing fragment instances, adding or removing from the end when necessary. This means that reordering the array will cause fragment objects' data to swap, rather than simply reordering the array of fragments in memory. The biggest implication of this behavior is when a fragment in a fragment array is dirty and the parent model gets reloaded. If the record is then saved, the change will likely affect the wrong object, causing data loss. Additionally, any time a reference to a model fragment is held onto, reloading can give it a completely different semantic meaning. If your app does not persist models with fragment arrays, this is of no concern (and indeed you may wish to use the `EmbeddedRecordMixin` instead).

### Filtered Record Arrays

Another consequence of id-less records is that an ID map of all fragment instances of a given type is not possible. This means no `store.all('<fragment_type>')`, and no ability to display all known fragments (e.g. names or addresses) without iterating over all owner records and manually building a list.

### Relationships to Models

Currently, fragments cannot have normal `belongsTo` or `hasMany` relationships. This is not a technical limitation, but rather due to the fact that relationship management in Ember Data is in a state of flux and would require accessing private (and changing) APIs.

## Testing

Building requires [Ember CLI](http://www.ember-cli.com/) and running tests requires [Test 'Em](https://github.com/airportyh/testem), which can all be installed globally with:

```sh
$ yarn global add ember-cli
```

Then install NPM packages and start the development test server:

```sh
$ yarn
$ ember test --server
```

It is also possible to run the tests in a headless fashion. This requires [PhantomJS 2](http://phantomjs.org) to be installed.

```sh
$ ember test

# Using `yarn test` will invoke `ember try:testall`.
# This will test each version of ember supported by this addon.
$ yarn test
```

## Contributing

When reporting an issue, follow the [Ember guidelines](https://github.com/emberjs/ember.js/blob/master/CONTRIBUTING.md#reporting-a-bug). When contributing features, follow [Github guidelines](https://help.github.com/articles/fork-a-repo) for forking and creating a new pull request. All existing tests must pass (or be suitably modified), and all new features must be accompanied by tests to be considered.
