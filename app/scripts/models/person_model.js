App.Person = DS.Model.extend({
  name      : DS.hasOneFragment('name'),
  addresses : DS.hasManyFragments('address'),
  titles    : DS.hasManyFragments()
});

App.Person.FIXTURES = [
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
];
