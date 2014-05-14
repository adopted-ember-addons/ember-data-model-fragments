App.IndexController = Ember.ArrayController.extend({
  actions: {
      addAddress: function(person) {

          var a = {
            "street": "1 Sky Cell",
            "city": "Eyre",
            "region": "Vale of Arryn",
            "country": "Westeros"
          };

          var frag = this.store.createFragment('address', a);
          person.get('addresses').pushObject(frag);
          person.save();
          console.log(person);
      },
      addTitle: function(person) {

          var t = "Awesome";

          person.get('titles').pushObject(t);
          person.save();
          console.log(person);
      }
  }
});
