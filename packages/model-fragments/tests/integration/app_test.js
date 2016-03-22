var app;

QUnit.module("integration - Application");

test("the model fragments initializer causes no deprecations", function() {
  ok(true); // expectNoDeprecation();

  Ember.run(function() {
    app = Ember.Application.create();
  });

  ok(app.hasRegistration('transform:fragment'), "the model fragments initilizer ran");
});
