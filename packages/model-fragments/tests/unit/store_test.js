var store, Person, Name;

module("unit/fragments - DS.Store", {
  setup: function() {
    Person = DS.Model.extend({
      name: DS.hasOneFragment("name"),
    });

    Name = DS.ModelFragment.extend({
      first : DS.attr("string"),
      last  : DS.attr("string")
    });

    store = createStore({
      person: Person,
      name: Name
    });
  },

  teardown: function() {
    store = null;
    Person = null;
    Name = null;
  }
});

test("a fragment can be created that starts in a dirty state", function() {
  var address = store.createFragment('name');

  ok(address instanceof Name, "fragment is correct type");
  ok(address.get('isDirty'), "fragment starts in dirty state");
});

test("attempting to create a fragment type that does not inherit from `DS.ModelFragment` throws an error", function() {
  throws(function() {
    store.createFragment('person');
  }, "an error is thrown when given a bad type");
});
