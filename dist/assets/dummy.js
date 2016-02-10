"use strict";
/* jshint ignore:start */

/* jshint ignore:end */

define('dummy/app', ['exports', 'ember', 'ember/resolver', 'ember/load-initializers', 'dummy/config/environment'], function (exports, _ember, _emberResolver, _emberLoadInitializers, _dummyConfigEnvironment) {

  var App = undefined;

  _ember['default'].MODEL_FACTORY_INJECTIONS = true;

  App = _ember['default'].Application.extend({
    modulePrefix: _dummyConfigEnvironment['default'].modulePrefix,
    podModulePrefix: _dummyConfigEnvironment['default'].podModulePrefix,
    Resolver: _emberResolver['default']
  });

  (0, _emberLoadInitializers['default'])(App, _dummyConfigEnvironment['default'].modulePrefix);

  exports['default'] = App;
});
define('dummy/components/app-version', ['exports', 'ember-cli-app-version/components/app-version', 'dummy/config/environment'], function (exports, _emberCliAppVersionComponentsAppVersion, _dummyConfigEnvironment) {

  var name = _dummyConfigEnvironment['default'].APP.name;
  var version = _dummyConfigEnvironment['default'].APP.version;

  exports['default'] = _emberCliAppVersionComponentsAppVersion['default'].extend({
    version: version,
    name: name
  });
});
define('dummy/controllers/array', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller;
});
define('dummy/controllers/object', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = _ember['default'].Controller;
});
define('dummy/ember-data-model-fragments/tests/modules/ember-data-model-fragments/array/fragment.jshint', ['exports'], function (exports) {
  QUnit.module('JSHint - modules/ember-data-model-fragments/array');
  QUnit.test('modules/ember-data-model-fragments/array/fragment.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'modules/ember-data-model-fragments/array/fragment.js should pass jshint.');
  });
});
define('dummy/ember-data-model-fragments/tests/modules/ember-data-model-fragments/array/stateful.jshint', ['exports'], function (exports) {
  QUnit.module('JSHint - modules/ember-data-model-fragments/array');
  QUnit.test('modules/ember-data-model-fragments/array/stateful.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'modules/ember-data-model-fragments/array/stateful.js should pass jshint.');
  });
});
define('dummy/ember-data-model-fragments/tests/modules/ember-data-model-fragments/attributes.jshint', ['exports'], function (exports) {
  QUnit.module('JSHint - modules/ember-data-model-fragments');
  QUnit.test('modules/ember-data-model-fragments/attributes.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'modules/ember-data-model-fragments/attributes.js should pass jshint.');
  });
});
define('dummy/ember-data-model-fragments/tests/modules/ember-data-model-fragments/ext.jshint', ['exports'], function (exports) {
  QUnit.module('JSHint - modules/ember-data-model-fragments');
  QUnit.test('modules/ember-data-model-fragments/ext.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'modules/ember-data-model-fragments/ext.js should pass jshint.');
  });
});
define('dummy/ember-data-model-fragments/tests/modules/ember-data-model-fragments/fragment.jshint', ['exports'], function (exports) {
  QUnit.module('JSHint - modules/ember-data-model-fragments');
  QUnit.test('modules/ember-data-model-fragments/fragment.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'modules/ember-data-model-fragments/fragment.js should pass jshint.');
  });
});
define('dummy/ember-data-model-fragments/tests/modules/ember-data-model-fragments/index.jshint', ['exports'], function (exports) {
  QUnit.module('JSHint - modules/ember-data-model-fragments');
  QUnit.test('modules/ember-data-model-fragments/index.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'modules/ember-data-model-fragments/index.js should pass jshint.');
  });
});
define('dummy/ember-data-model-fragments/tests/modules/ember-data-model-fragments/states.jshint', ['exports'], function (exports) {
  QUnit.module('JSHint - modules/ember-data-model-fragments');
  QUnit.test('modules/ember-data-model-fragments/states.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'modules/ember-data-model-fragments/states.js should pass jshint.');
  });
});
define('dummy/ember-data-model-fragments/tests/modules/ember-data-model-fragments/transforms/array.jshint', ['exports'], function (exports) {
  QUnit.module('JSHint - modules/ember-data-model-fragments/transforms');
  QUnit.test('modules/ember-data-model-fragments/transforms/array.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'modules/ember-data-model-fragments/transforms/array.js should pass jshint.');
  });
});
define('dummy/ember-data-model-fragments/tests/modules/ember-data-model-fragments/transforms/fragment-array.jshint', ['exports'], function (exports) {
  QUnit.module('JSHint - modules/ember-data-model-fragments/transforms');
  QUnit.test('modules/ember-data-model-fragments/transforms/fragment-array.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'modules/ember-data-model-fragments/transforms/fragment-array.js should pass jshint.');
  });
});
define('dummy/ember-data-model-fragments/tests/modules/ember-data-model-fragments/transforms/fragment.jshint', ['exports'], function (exports) {
  QUnit.module('JSHint - modules/ember-data-model-fragments/transforms');
  QUnit.test('modules/ember-data-model-fragments/transforms/fragment.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'modules/ember-data-model-fragments/transforms/fragment.js should pass jshint.');
  });
});
define('dummy/ember-data-model-fragments/tests/modules/ember-data-model-fragments/util/ember-new-computed.jshint', ['exports'], function (exports) {
  QUnit.module('JSHint - modules/ember-data-model-fragments/util');
  QUnit.test('modules/ember-data-model-fragments/util/ember-new-computed.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'modules/ember-data-model-fragments/util/ember-new-computed.js should pass jshint.');
  });
});
define('dummy/ember-data-model-fragments/tests/modules/ember-data-model-fragments/util/instance-of-type.jshint', ['exports'], function (exports) {
  QUnit.module('JSHint - modules/ember-data-model-fragments/util');
  QUnit.test('modules/ember-data-model-fragments/util/instance-of-type.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'modules/ember-data-model-fragments/util/instance-of-type.js should pass jshint.');
  });
});
define('dummy/ember-data-model-fragments/tests/modules/ember-data-model-fragments/util/map.jshint', ['exports'], function (exports) {
  QUnit.module('JSHint - modules/ember-data-model-fragments/util');
  QUnit.test('modules/ember-data-model-fragments/util/map.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'modules/ember-data-model-fragments/util/map.js should pass jshint.');
  });
});
define('dummy/helpers/pluralize', ['exports', 'ember-inflector/lib/helpers/pluralize'], function (exports, _emberInflectorLibHelpersPluralize) {
  exports['default'] = _emberInflectorLibHelpersPluralize['default'];
});
define('dummy/helpers/singularize', ['exports', 'ember-inflector/lib/helpers/singularize'], function (exports, _emberInflectorLibHelpersSingularize) {
  exports['default'] = _emberInflectorLibHelpersSingularize['default'];
});
define('dummy/initializers/app-version', ['exports', 'ember-cli-app-version/initializer-factory', 'dummy/config/environment'], function (exports, _emberCliAppVersionInitializerFactory, _dummyConfigEnvironment) {
  exports['default'] = {
    name: 'App Version',
    initialize: (0, _emberCliAppVersionInitializerFactory['default'])(_dummyConfigEnvironment['default'].APP.name, _dummyConfigEnvironment['default'].APP.version)
  };
});
define('dummy/initializers/data-adapter', ['exports', 'ember'], function (exports, _ember) {

  /*
    This initializer is here to keep backwards compatibility with code depending
    on the `data-adapter` initializer (before Ember Data was an addon).
  
    Should be removed for Ember Data 3.x
  */

  exports['default'] = {
    name: 'data-adapter',
    before: 'store',
    initialize: _ember['default'].K
  };
});
define('dummy/initializers/ember-data', ['exports', 'ember-data/setup-container', 'ember-data/-private/core'], function (exports, _emberDataSetupContainer, _emberDataPrivateCore) {

  /*
  
    This code initializes Ember-Data onto an Ember application.
  
    If an Ember.js developer defines a subclass of DS.Store on their application,
    as `App.StoreService` (or via a module system that resolves to `service:store`)
    this code will automatically instantiate it and make it available on the
    router.
  
    Additionally, after an application's controllers have been injected, they will
    each have the store made available to them.
  
    For example, imagine an Ember.js application with the following classes:
  
    App.StoreService = DS.Store.extend({
      adapter: 'custom'
    });
  
    App.PostsController = Ember.ArrayController.extend({
      // ...
    });
  
    When the application is initialized, `App.ApplicationStore` will automatically be
    instantiated, and the instance of `App.PostsController` will have its `store`
    property set to that instance.
  
    Note that this code will only be run if the `ember-application` package is
    loaded. If Ember Data is being used in an environment other than a
    typical application (e.g., node.js where only `ember-runtime` is available),
    this code will be ignored.
  */

  exports['default'] = {
    name: 'ember-data',
    initialize: _emberDataSetupContainer['default']
  };
});
define('dummy/initializers/export-application-global', ['exports', 'ember', 'dummy/config/environment'], function (exports, _ember, _dummyConfigEnvironment) {
  exports.initialize = initialize;

  function initialize() {
    var application = arguments[1] || arguments[0];
    if (_dummyConfigEnvironment['default'].exportApplicationGlobal !== false) {
      var value = _dummyConfigEnvironment['default'].exportApplicationGlobal;
      var globalName;

      if (typeof value === 'string') {
        globalName = value;
      } else {
        globalName = _ember['default'].String.classify(_dummyConfigEnvironment['default'].modulePrefix);
      }

      if (!window[globalName]) {
        window[globalName] = application;

        application.reopen({
          willDestroy: function willDestroy() {
            this._super.apply(this, arguments);
            delete window[globalName];
          }
        });
      }
    }
  }

  exports['default'] = {
    name: 'export-application-global',

    initialize: initialize
  };
});
define('dummy/initializers/injectStore', ['exports', 'ember'], function (exports, _ember) {

  /*
    This initializer is here to keep backwards compatibility with code depending
    on the `injectStore` initializer (before Ember Data was an addon).
  
    Should be removed for Ember Data 3.x
  */

  exports['default'] = {
    name: 'injectStore',
    before: 'store',
    initialize: _ember['default'].K
  };
});
define('dummy/initializers/model-fragments', ['exports', 'ember-data-model-fragments/transforms/fragment', 'ember-data-model-fragments/transforms/fragment-array', 'ember-data-model-fragments/transforms/array'], function (exports, _emberDataModelFragmentsTransformsFragment, _emberDataModelFragmentsTransformsFragmentArray, _emberDataModelFragmentsTransformsArray) {
  exports['default'] = {
    name: "fragmentTransform",
    before: "store",

    initialize: function initialize(application) {
      application.register('transform:fragment', _emberDataModelFragmentsTransformsFragment['default']);
      application.register('transform:fragment-array', _emberDataModelFragmentsTransformsFragmentArray['default']);
      application.register('transform:array', _emberDataModelFragmentsTransformsArray['default']);
    }
  };
});
define('dummy/initializers/store', ['exports', 'ember'], function (exports, _ember) {

  /*
    This initializer is here to keep backwards compatibility with code depending
    on the `store` initializer (before Ember Data was an addon).
  
    Should be removed for Ember Data 3.x
  */

  exports['default'] = {
    name: 'store',
    after: 'ember-data',
    initialize: _ember['default'].K
  };
});
define('dummy/initializers/transforms', ['exports', 'ember'], function (exports, _ember) {

  /*
    This initializer is here to keep backwards compatibility with code depending
    on the `transforms` initializer (before Ember Data was an addon).
  
    Should be removed for Ember Data 3.x
  */

  exports['default'] = {
    name: 'transforms',
    before: 'store',
    initialize: _ember['default'].K
  };
});
define("dummy/instance-initializers/ember-data", ["exports", "ember-data/-private/instance-initializers/initialize-store-service"], function (exports, _emberDataPrivateInstanceInitializersInitializeStoreService) {
  exports["default"] = {
    name: "ember-data",
    initialize: _emberDataPrivateInstanceInitializersInitializeStoreService["default"]
  };
});
define('dummy/models/address', ['exports', 'ember-data-model-fragments', 'ember-data'], function (exports, _emberDataModelFragments, _emberData) {
  exports['default'] = _emberDataModelFragments['default'].Fragment.extend({
    street: _emberData['default'].attr('string'),
    city: _emberData['default'].attr('string'),
    region: _emberData['default'].attr('string'),
    country: _emberData['default'].attr('string')
  });
});
define('dummy/models/animal', ['exports', 'ember-data', 'ember-data-model-fragments'], function (exports, _emberData, _emberDataModelFragments) {
  exports['default'] = _emberDataModelFragments['default'].Fragment.extend({
    name: _emberData['default'].attr('string')
  });
});
define('dummy/models/elephant', ['exports', 'ember-data', 'dummy/models/animal'], function (exports, _emberData, _dummyModelsAnimal) {
  exports['default'] = _dummyModelsAnimal['default'].extend({
    trunkLength: _emberData['default'].attr('number')
  });
});
define('dummy/models/hobby', ['exports', 'ember-data-model-fragments', 'ember-data'], function (exports, _emberDataModelFragments, _emberData) {
  exports['default'] = _emberDataModelFragments['default'].Fragment.extend({
    name: _emberData['default'].attr('string')
  });
});
define('dummy/models/house', ['exports', 'ember-data-model-fragments', 'ember-data'], function (exports, _emberDataModelFragments, _emberData) {
  exports['default'] = _emberDataModelFragments['default'].Fragment.extend({
    name: _emberData['default'].attr('string'),
    region: _emberData['default'].attr('string'),
    exiled: _emberData['default'].attr('boolean')
  });
});
define('dummy/models/info', ['exports', 'ember-data-model-fragments', 'ember-data'], function (exports, _emberDataModelFragments, _emberData) {
  exports['default'] = _emberDataModelFragments['default'].Fragment.extend({
    name: _emberData['default'].attr('string'),
    notes: _emberDataModelFragments['default'].array()
  });
});
define('dummy/models/lion', ['exports', 'ember-data', 'dummy/models/animal'], function (exports, _emberData, _dummyModelsAnimal) {
  exports['default'] = _dummyModelsAnimal['default'].extend({
    hasManes: _emberData['default'].attr('boolean')
  });
});
define('dummy/models/name', ['exports', 'ember-data-model-fragments', 'ember-data'], function (exports, _emberDataModelFragments, _emberData) {
  exports['default'] = _emberDataModelFragments['default'].Fragment.extend({
    first: _emberData['default'].attr('string'),
    last: _emberData['default'].attr('string'),
    person: _emberDataModelFragments['default'].fragmentOwner()
  });
});
define('dummy/models/order', ['exports', 'ember-data-model-fragments', 'ember-data'], function (exports, _emberDataModelFragments, _emberData) {
  exports['default'] = _emberDataModelFragments['default'].Fragment.extend({
    amount: _emberData['default'].attr('string'),
    recurring: _emberData['default'].attr('boolean'),
    products: _emberDataModelFragments['default'].fragmentArray('product'),
    product: _emberDataModelFragments['default'].fragment('product')
  });
});
define('dummy/models/person', ['exports', 'ember-data', 'ember-data-model-fragments'], function (exports, _emberData, _emberDataModelFragments) {
  exports['default'] = _emberData['default'].Model.extend({
    title: _emberData['default'].attr('string'),
    nickName: _emberData['default'].attr('string'),
    name: _emberDataModelFragments['default'].fragment('name'),
    names: _emberDataModelFragments['default'].fragmentArray('name'),
    addresses: _emberDataModelFragments['default'].fragmentArray('address'),
    titles: _emberDataModelFragments['default'].array(),
    hobbies: _emberDataModelFragments['default'].fragmentArray('hobby', { defaultValue: null }),
    houses: _emberDataModelFragments['default'].fragmentArray('house'),
    children: _emberDataModelFragments['default'].array(),
    strings: _emberDataModelFragments['default'].array('string'),
    numbers: _emberDataModelFragments['default'].array('number'),
    booleans: _emberDataModelFragments['default'].array('boolean')
  });
});
define('dummy/models/product', ['exports', 'ember-data-model-fragments', 'ember-data'], function (exports, _emberDataModelFragments, _emberData) {
  exports['default'] = _emberDataModelFragments['default'].Fragment.extend({
    name: _emberData['default'].attr('string'),
    sku: _emberData['default'].attr('string'),
    price: _emberData['default'].attr('string')
  });
});
define('dummy/models/user', ['exports', 'ember-data', 'ember-data-model-fragments'], function (exports, _emberData, _emberDataModelFragments) {
  exports['default'] = _emberData['default'].Model.extend({
    info: _emberDataModelFragments['default'].fragment('info'),
    orders: _emberDataModelFragments['default'].fragmentArray('order')
  });
});
define('dummy/models/zoo', ['exports', 'ember-data', 'ember-data-model-fragments'], function (exports, _emberData, _emberDataModelFragments) {
  exports['default'] = _emberData['default'].Model.extend({
    name: _emberData['default'].attr('string'),
    city: _emberData['default'].attr('string'),
    star: _emberDataModelFragments['default'].fragment('animal', { polymorphic: true, typeKey: '$type' }),
    animals: _emberDataModelFragments['default'].fragmentArray('animal', { polymorphic: true, typeKey: '$type' })
  });
});
define('dummy/router', ['exports', 'ember', 'dummy/config/environment'], function (exports, _ember, _dummyConfigEnvironment) {

  var Router = _ember['default'].Router.extend({
    location: _dummyConfigEnvironment['default'].locationType
  });

  Router.map(function () {});

  exports['default'] = Router;
});
define("dummy/templates/application", ["exports"], function (exports) {
  exports["default"] = Ember.HTMLBars.template((function () {
    return {
      meta: {
        "fragmentReason": {
          "name": "missing-wrapper",
          "problems": ["multiple-nodes", "wrong-type"]
        },
        "revision": "Ember@2.3.0",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 4,
            "column": 0
          }
        },
        "moduleName": "dummy/templates/application.hbs"
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("h2");
        dom.setAttribute(el1, "id", "title");
        var el2 = dom.createTextNode("Welcome to Ember");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment, 2, 2, contextualElement);
        return morphs;
      },
      statements: [["content", "outlet", ["loc", [null, [3, 0], [3, 10]]]]],
      locals: [],
      templates: []
    };
  })());
});
define('dummy/transforms/array', ['exports', 'ember-data-model-fragments/transforms/array'], function (exports, _emberDataModelFragmentsTransformsArray) {
  exports['default'] = _emberDataModelFragmentsTransformsArray['default'];
});
define('dummy/transforms/fragment-array', ['exports', 'ember-data-model-fragments/transforms/fragment-array'], function (exports, _emberDataModelFragmentsTransformsFragmentArray) {
  exports['default'] = _emberDataModelFragmentsTransformsFragmentArray['default'];
});
define('dummy/transforms/fragment', ['exports', 'ember-data-model-fragments/transforms/fragment'], function (exports, _emberDataModelFragmentsTransformsFragment) {
  exports['default'] = _emberDataModelFragmentsTransformsFragment['default'];
});
/* jshint ignore:start */

/* jshint ignore:end */

/* jshint ignore:start */

define('dummy/config/environment', ['ember'], function(Ember) {
  var prefix = 'dummy';
/* jshint ignore:start */

try {
  var metaName = prefix + '/config/environment';
  var rawConfig = Ember['default'].$('meta[name="' + metaName + '"]').attr('content');
  var config = JSON.parse(unescape(rawConfig));

  return { 'default': config };
}
catch(err) {
  throw new Error('Could not read config from meta tag with name "' + metaName + '".');
}

/* jshint ignore:end */

});

if (!runningTests) {
  require("dummy/app")["default"].create({"name":"ember-data-model-fragments","version":"2.1.1+a42d9040"});
}

/* jshint ignore:end */
//# sourceMappingURL=dummy.map