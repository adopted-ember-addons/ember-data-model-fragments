var Ember = window.Ember; // Relies on Ember being a global

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CONTAINER = "__" + new Date() + "_container";
var REGISTRY = "__" + new Date() + "_registry";

var FakeOwner = function () {
  function FakeOwner(object) {
    _classCallCheck(this, FakeOwner);

    this[CONTAINER] = object.container;

    if (Ember.Registry) {
      // object.container._registry is used by 1.11
      this[REGISTRY] = object.container.registry || object.container._registry;
    } else {
      // Ember < 1.12
      this[REGISTRY] = object.container;
    }
  }

  // ContainerProxyMixin methods
  //
  // => http://emberjs.com/api/classes/ContainerProxyMixin.html
  //


  FakeOwner.prototype.lookup = function lookup() {
    var _CONTAINER;

    return (_CONTAINER = this[CONTAINER]).lookup.apply(_CONTAINER, arguments);
  };

  FakeOwner.prototype._lookupFactory = function _lookupFactory() {
    var _CONTAINER2;

    return (_CONTAINER2 = this[CONTAINER]).lookupFactory.apply(_CONTAINER2, arguments);
  };

  // RegistryProxyMixin methods
  //
  // => http://emberjs.com/api/classes/RegistryProxyMixin.html
  //


  FakeOwner.prototype.hasRegistration = function hasRegistration() {
    var _REGISTRY;

    return (_REGISTRY = this[REGISTRY]).has.apply(_REGISTRY, arguments);
  };

  FakeOwner.prototype.inject = function inject() {
    var _REGISTRY2;

    return (_REGISTRY2 = this[REGISTRY]).injection.apply(_REGISTRY2, arguments);
  };

  FakeOwner.prototype.register = function register() {
    var _REGISTRY3;

    return (_REGISTRY3 = this[REGISTRY]).register.apply(_REGISTRY3, arguments);
  };

  FakeOwner.prototype.registerOption = function registerOption() {
    var _REGISTRY4;

    return (_REGISTRY4 = this[REGISTRY]).option.apply(_REGISTRY4, arguments);
  };

  FakeOwner.prototype.registerOptions = function registerOptions() {
    var _REGISTRY5;

    return (_REGISTRY5 = this[REGISTRY]).options.apply(_REGISTRY5, arguments);
  };

  FakeOwner.prototype.registerOptionsForType = function registerOptionsForType() {
    var _REGISTRY6;

    return (_REGISTRY6 = this[REGISTRY]).optionsForType.apply(_REGISTRY6, arguments);
  };

  FakeOwner.prototype.registeredOption = function registeredOption() {
    var _REGISTRY7;

    return (_REGISTRY7 = this[REGISTRY]).getOption.apply(_REGISTRY7, arguments);
  };

  FakeOwner.prototype.registeredOptions = function registeredOptions() {
    var _REGISTRY8;

    return (_REGISTRY8 = this[REGISTRY]).getOptions.apply(_REGISTRY8, arguments);
  };

  FakeOwner.prototype.registeredOptionsForType = function registeredOptionsForType(type) {
    if (this[REGISTRY].getOptionsForType) {
      var _REGISTRY9;

      return (_REGISTRY9 = this[REGISTRY]).getOptionsForType.apply(_REGISTRY9, arguments);
    } else {
      // used for Ember 1.10
      return this[REGISTRY]._typeOptions[type];
    }
  };

  FakeOwner.prototype.resolveRegistration = function resolveRegistration() {
    var _REGISTRY10;

    return (_REGISTRY10 = this[REGISTRY]).resolve.apply(_REGISTRY10, arguments);
  };

  FakeOwner.prototype.unregister = function unregister() {
    var _REGISTRY11;

    return (_REGISTRY11 = this[REGISTRY]).unregister.apply(_REGISTRY11, arguments);
  };

  return FakeOwner;
}();

var hasGetOwner = !!Ember.getOwner;

export default function(object) {
  var owner;

  if (hasGetOwner) {
    owner = Ember.getOwner(object);
  }

  if (!owner && object.container) {
    owner = new FakeOwner(object);
  }

  return owner;
}