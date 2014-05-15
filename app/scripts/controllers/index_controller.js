App.IndexController = Ember.ArrayController.extend({
  actions: {
      addAddress: function(person) {

          var a = {
            "streets": [],
            "city": "Eyre",
            "region": "Vale of Arryn",
            "country": "Westeros"
          };

          var frag = this.store.createFragment('address', a);
          person.get('addresses').pushObject(frag);
          person.save();
          console.log(person);
      },
      addStreet: function(address) {
          var a = {"name":"2 Sky Cell"};

          var frag = this.store.createFragment('street', a);
          address.get('streets').pushObject(frag);
          console.log(address);
          address.get('_owner').save();
      },
      addTitle: function(person) {

          var t = "Awesome";

          person.get('titles').pushObject(t);
          person.save();
          console.log(person);
      }
  }
});
