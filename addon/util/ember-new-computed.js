var Ember = window.Ember;
var computed = Ember.computed;
var supportsSetterGetter;

try {
  Ember.computed({
    set: function() { },
    get: function() { }
  });
  supportsSetterGetter = true;
} catch(e) {
  supportsSetterGetter = false;
}

export default function() {
  var polyfillArguments = [];
  var config = arguments[arguments.length - 1];

  if (typeof config === 'function' || supportsSetterGetter) {
    return computed.apply(this, arguments);
  }

  for (var i = 0, l = arguments.length - 1; i < l; i++) {
    polyfillArguments.push(arguments[i]);
  }

  var func;
  if (config.set) {
    func = function(key, value) {
      if (arguments.length > 1) {
        return config.set.call(this, key, value);
      } else {
        return config.get.call(this, key);
      }
    };
  } else {
    func = function(key) {
      return config.get.call(this, key);
    };
  }

  polyfillArguments.push(func);

  return computed.apply(this, polyfillArguments);
}
