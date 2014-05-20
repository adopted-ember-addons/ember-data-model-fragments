# Ember Data: Model Fragments [![Build Status](https://travis-ci.org/lytics/ember-data.model-fragments.svg)](https://travis-ci.org/lytics/ember-data.model-fragments)

This package provides support for sub-models that can be treated much like `belongsTo` and `hasMany` relationships are, but whose persistence is managed completely through the parent object.

## Example

```javascript
App.Person = DS.Model.extend({
  name      : DS.hasOneFragment('name'),
  addresses : DS.hasManyFragments('adress'),
  titles    : DS.hasManyFragments()
});

App.Name = DS.ModelFragment.extend({
  first  : DS.attr('string'),
  last   : DS.attr('string')
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
  "adresses": [
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
```

The `addresses` attribute can be treated similar to a `hasMany` relationship:

```javascript
var person = store.getById('person', '1');
var address = person.get('addresses.lastObject');

person.get('isDirty'); // false
address.get('country'); // 'Westeros'

address.set('country', 'Essos');
person.get('isDirty'); // true

person.rollback();
address.get('country'); // 'Westeros'
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
