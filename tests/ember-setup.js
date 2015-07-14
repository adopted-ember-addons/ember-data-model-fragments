Ember.RSVP.on('error', function(reason) {
  // only print error messages if they're exceptions;
  // otherwise, let a future turn of the event loop
  // handle the error.
  if (reason && reason instanceof Error) {
    Ember.Logger.log(reason, reason.stack);
    throw reason;
  }
});

window.setupEnv = function(options) {
  var container, registry;
  var env = {};
  options = options || {};

  if (Ember.Registry) {
    registry = env.registry = new Ember.Registry();
    container = env.container = registry.container();
  } else {
    container = env.container = new Ember.Container();
    registry = env.registry = container;
  }

  // Silence ED 2.0 behavior change warning
  var adapterOptions = {
    shouldBackgroundReloadRecord: function() { return false; }
  };

  for (var prop in options) {
    registry.register('model:' + Ember.String.dasherize(prop), options[prop]);
  }

  registry.register('store:main', DS.Store.extend({
    adapter: '-default'
  }));

  registry.optionsForType('serializer', { singleton: false });
  registry.optionsForType('adapter', { singleton: false });
  registry.register('adapter:-default', DS.Adapter.extend(adapterOptions));
  registry.register('serializer:-default', DS.JSONSerializer);
  registry.register('transform:boolean', DS.BooleanTransform);
  registry.register('transform:date', DS.DateTransform);
  registry.register('transform:number', DS.NumberTransform);
  registry.register('transform:string', DS.StringTransform);
  registry.register('transform:fragment', DS.FragmentTransform);
  registry.register('transform:fragment-array', DS.FragmentArrayTransform);
  registry.register('transform:array', DS.ArrayTransform);

  registry.injection('serializer', 'store', 'store:main');

  env.serializer = container.lookupFactory('serializer:-default');
  env.store = container.lookup('store:main');
  env.adapter = env.store.get('defaultAdapter');

  return env;
};

