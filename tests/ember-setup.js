window.setupStore = function(options) {
  var env = {};
  options = options || {};

  var container = env.container = new Ember.Container();

  var adapter = env.adapter = (options.adapter || DS.Adapter);
  delete options.adapter;

  for (var prop in options) {
    container.register('model:' + prop, options[prop]);
  }

  container.register('store:main', DS.Store.extend({
    adapter: adapter
  }));

  container.register('serializer:-default', DS.JSONSerializer);
  container.register('serializer:-rest', DS.RESTSerializer);
  container.register('adapter:-rest', DS.RESTAdapter);

  container.injection('serializer', 'store', 'store:main');

  env.serializer = container.lookup('serializer:-default');
  env.restSerializer = container.lookup('serializer:-rest');
  env.store = container.lookup('store:main');
  env.adapter = env.store.get('defaultAdapter');

  return env;
};

window.createStore = function(options) {
  return setupStore(options).store;
};

var syncForTest = window.syncForTest = function(fn) {
  var callSuper;

  if (typeof fn !== "function") { callSuper = true; }

  return function() {
    var override = false, ret;

    if (Ember.run && !Ember.run.currentRunLoop) {
      Ember.run.begin();
      override = true;
    }

    try {
      if (callSuper) {
        ret = this._super.apply(this, arguments);
      } else {
        ret = fn.apply(this, arguments);
      }
    } finally {
      if (override) {
        Ember.run.end();
      }
    }

    return ret;
  };
};
