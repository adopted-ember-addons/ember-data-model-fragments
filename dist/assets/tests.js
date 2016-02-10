define('dummy/tests/app.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - .');
  QUnit.test('app.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'app.js should pass jshint.');
  });
});
define('dummy/tests/helpers/destroy-app', ['exports', 'ember'], function (exports, _ember) {
  exports['default'] = destroyApp;

  function destroyApp(application) {
    _ember['default'].run(application, 'destroy');
  }
});
define('dummy/tests/helpers/destroy-app.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - helpers');
  QUnit.test('helpers/destroy-app.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/destroy-app.js should pass jshint.');
  });
});
define('dummy/tests/helpers/module-for-acceptance', ['exports', 'qunit', 'dummy/tests/helpers/start-app', 'dummy/tests/helpers/destroy-app'], function (exports, _qunit, _dummyTestsHelpersStartApp, _dummyTestsHelpersDestroyApp) {
  exports['default'] = function (name) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    (0, _qunit.module)(name, {
      beforeEach: function beforeEach() {
        this.application = (0, _dummyTestsHelpersStartApp['default'])();

        if (options.beforeEach) {
          options.beforeEach.apply(this, arguments);
        }
      },

      afterEach: function afterEach() {
        (0, _dummyTestsHelpersDestroyApp['default'])(this.application);

        if (options.afterEach) {
          options.afterEach.apply(this, arguments);
        }
      }
    });
  };
});
define('dummy/tests/helpers/module-for-acceptance.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - helpers');
  QUnit.test('helpers/module-for-acceptance.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/module-for-acceptance.js should pass jshint.');
  });
});
define('dummy/tests/helpers/resolver', ['exports', 'ember/resolver', 'dummy/config/environment'], function (exports, _emberResolver, _dummyConfigEnvironment) {

  var resolver = _emberResolver['default'].create();

  resolver.namespace = {
    modulePrefix: _dummyConfigEnvironment['default'].modulePrefix,
    podModulePrefix: _dummyConfigEnvironment['default'].podModulePrefix
  };

  exports['default'] = resolver;
});
define('dummy/tests/helpers/resolver.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - helpers');
  QUnit.test('helpers/resolver.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/resolver.js should pass jshint.');
  });
});
define('dummy/tests/helpers/start-app', ['exports', 'ember', 'dummy/app', 'dummy/config/environment'], function (exports, _ember, _dummyApp, _dummyConfigEnvironment) {
  exports['default'] = startApp;

  function startApp(attrs) {
    var application = undefined;

    var attributes = _ember['default'].merge({}, _dummyConfigEnvironment['default'].APP);
    attributes = _ember['default'].merge(attributes, attrs); // use defaults, but you can override;

    _ember['default'].run(function () {
      application = _dummyApp['default'].create(attributes);
      application.setupForTesting();
      application.injectTestHelpers();
    });

    return application;
  }
});
define('dummy/tests/helpers/start-app.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - helpers');
  QUnit.test('helpers/start-app.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/start-app.js should pass jshint.');
  });
});
define('dummy/tests/integration/app_test', ['exports', 'qunit', 'dummy/tests/helpers/module-for-acceptance'], function (exports, _qunit, _dummyTestsHelpersModuleForAcceptance) {

  (0, _dummyTestsHelpersModuleForAcceptance['default'])('Integration | Application');

  (0, _qunit.test)("the model fragments initializer causes no deprecations", function (assert) {
    //expectNoDeprecation();

    assert.ok(this.application.hasRegistration('transform:fragment'), "the model fragments initilizer ran");
  });
});
define('dummy/tests/integration/app_test.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - integration');
  QUnit.test('integration/app_test.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/app_test.js should pass jshint.');
  });
});
define('dummy/tests/integration/dependent_state_test', ['exports', 'ember', 'qunit', 'dummy/tests/helpers/module-for-acceptance'], function (exports, _ember, _qunit, _dummyTestsHelpersModuleForAcceptance) {

  var store, people;

  (0, _dummyTestsHelpersModuleForAcceptance['default'])("integration - Dependent State", {
    beforeEach: function beforeEach() {
      store = this.application.__container__.lookup('service:store');

      //expectNoDeprecation();

      people = [{
        id: 1,
        name: {
          first: "Tyrion",
          last: "Lannister"
        },
        addresses: [{
          street: "1 Sky Cell",
          city: "Eyre",
          region: "Vale of Arryn",
          country: "Westeros"
        }, {
          street: "1 Tower of the Hand",
          city: "King's Landing",
          region: "Crownlands",
          country: "Westeros"
        }],
        titles: ["Hand of the King", "Master of Coin"]
      }];
    },

    afterEach: function afterEach() {
      store = null;
      people = null;
    }
  });

  function pushPerson(id) {
    store.push({
      data: {
        type: 'person',
        id: id,
        attributes: _ember['default'].A(people).findBy('id', id)
      }
    });
  }

  (0, _qunit.test)("changing a fragment property dirties the fragment and owner record", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: "Jamie",
              last: "Lannister"
            }
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        var name = person.get('name');

        name.set('first', 'Cercei');

        assert.ok(name.get('hasDirtyAttributes'), "fragment is dirty");
        assert.ok(person.get('hasDirtyAttributes'), "owner record is dirty");
      });
    });
  });

  (0, _qunit.test)("setting a fragment property to an object literal dirties the fragment and owner record", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: "Visenya",
              last: "Targaryen"
            }
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        var name = person.get('name');

        person.set('name', {
          first: 'Rhaenys'
        });

        assert.ok(name.get('hasDirtyAttributes'), "fragment is dirty");
        assert.ok(person.get('hasDirtyAttributes'), "owner record is dirty");
      });
    });
  });

  (0, _qunit.test)("setting a fragment property with an object literal to the same value does not dirty the fragment or owner record", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: "Samwell",
              last: "Tarly"
            }
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        var name = person.get('name');

        person.set('name', {
          first: "Samwell",
          last: "Tarly"
        });

        assert.ok(!name.get('hasDirtyAttributes'), "fragment is clean");
        assert.ok(!person.get('hasDirtyAttributes'), "owner record is clean");
      });
    });
  });

  (0, _qunit.test)("restoring a fragment property to its original state returns the fragment and owner record to a clean state", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: "Hoster",
              last: "Tully"
            }
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        var name = person.get('name');

        name.set('first', 'Brynden');
        name.set('first', 'Hoster');

        assert.ok(!name.get('hasDirtyAttributes'), "fragment is clean");
        assert.ok(!person.get('hasDirtyAttributes'), "owner record is clean");
      });
    });
  });

  (0, _qunit.test)("restoring a fragment property to its original state when the owner record was dirty returns the fragment to a clean state maintains the owner record's dirty state", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: "Jorah",
              last: "Mormont"
            }
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        var name = person.get('name');

        // Dirty the owner record
        person.set('title', 'Lord Commander');

        name.set('first', 'Jeor');
        name.set('first', 'Jorah');

        assert.ok(!name.get('hasDirtyAttributes'), "fragment is clean");
        assert.ok(person.get('hasDirtyAttributes'), "owner record is still dirty");
      });
    });
  });

  (0, _qunit.test)("rolling back the owner record returns fragment and owner record to a clean state", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: "Catelyn",
              last: "Stark"
            }
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        var name = person.get('name');

        name.set('last', 'Tully');

        person.rollbackAttributes();

        assert.ok(!name.get('hasDirtyAttributes'), "fragment is clean");
        assert.ok(!person.get('hasDirtyAttributes'), "owner record is clean");
      });
    });
  });

  (0, _qunit.test)("a record can be rolled back multiple times", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: "Arya",
              last: "Stark"
            }
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        var name = person.get('name');

        name.set('last', '');
        person.rollbackAttributes();

        assert.equal(name.get('last'), 'Stark', "fragment has correct values");
        assert.ok(!name.get('hasDirtyAttributes'), "fragment is clean");
        assert.ok(!person.get('hasDirtyAttributes'), "owner record is clean");

        name.set('last', '');
        person.rollbackAttributes();

        assert.equal(name.get('last'), 'Stark', "fragment has correct values");
        assert.ok(!name.get('hasDirtyAttributes'), "fragment is clean");
        assert.ok(!person.get('hasDirtyAttributes'), "owner record is clean");
      });
    });
  });

  (0, _qunit.test)("rolling back a fragment returns the fragment and the owner record to a clean state", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: "Sansa",
              last: "Stark"
            }
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        var name = person.get('name');

        // Dirty the fragment
        name.set('last', 'Lannister');

        name.rollbackAttributes();

        assert.ok(!name.get('hasDirtyAttributes'), "fragment is clean");
        assert.ok(!person.get('hasDirtyAttributes'), "owner record is clean");
      });
    });
  });

  (0, _qunit.test)("changing a fragment property then rolling back the owner record preserves the fragment's owner", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: "Arya",
              last: "Stark"
            }
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        var name = person.get('name');

        person.set('name', null);

        person.rollbackAttributes();

        assert.equal(name.get('person'), person, "fragment owner is preserved");
      });
    });
  });

  (0, _qunit.test)("rolling back a fragment when the owner record is dirty returns the fragment to a clean state and maintains the owner record's dirty state", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: "Sansa",
              last: "Stark"
            }
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        var name = person.get('name');

        // Dirty the owner record and fragment
        person.set('title', 'Heir to Winterfell');
        name.set('last', 'Lannister');

        name.rollbackAttributes();

        assert.ok(!name.get('hasDirtyAttributes'), "fragment is clean");
        assert.ok(person.get('hasDirtyAttributes'), "owner record is still dirty");
      });
    });
  });

  (0, _qunit.test)("a fragment property that is set to null can be rolled back", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        var name = person.get('name');

        person.set('name', null);

        assert.ok(person.get('hasDirtyAttributes'), "owner record is dirty");

        person.rollbackAttributes();

        assert.deepEqual(person.get('name'), name, "property is restored");
        assert.ok(!name.get('hasDirtyAttributes'), "fragment is clean");
        assert.ok(!person.get('hasDirtyAttributes'), "owner record is clean");
      });
    });
  });

  (0, _qunit.test)("a fragment property that is null can be rolled back", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {}
        }
      });

      return store.find('person', 1).then(function (person) {
        var name = person.get('name');

        assert.equal(name, undefined, "property is null");

        person.set('name', store.createFragment('name', { first: 'Rob', last: 'Stark' }));

        assert.ok(person.get('hasDirtyAttributes'), "owner record is dirty");

        person.rollbackAttributes();

        assert.equal(person.get('name'), null, "property is null again");
        assert.ok(!person.get('hasDirtyAttributes'), "owner record is clean");
      });
    });
  });

  (0, _qunit.test)("changing a fragment array property with object literals dirties the fragment and owner record", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        var addresses = person.get('addresses');

        person.set('addresses', [{
          street: "1 Sky Cell",
          city: "Eyre",
          region: "Vale of Arryn",
          country: "Westeros"
        }, {
          street: "1 Dungeon Cell",
          city: "King's Landing",
          region: "Crownlands",
          country: "Westeros"
        }]);

        assert.ok(addresses.get('hasDirtyAttributes'), "fragment array is dirty");
        assert.ok(person.get('hasDirtyAttributes'), "owner record is dirty");
      });
    });
  });

  (0, _qunit.test)("adding to a fragment array property with object literals dirties the fragment and owner record", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        var addresses = person.get('addresses');

        addresses.pushObject({
          street: "1 Dungeon Cell",
          city: "King's Landing",
          region: "Crownlands",
          country: "Westeros"
        });

        assert.ok(addresses.get('hasDirtyAttributes'), "fragment array is dirty");
        assert.ok(person.get('hasDirtyAttributes'), "owner record is dirty");
      });
    });
  });

  (0, _qunit.test)("setting a fragment property with object literals to the same values does not dirty the fragment or owner record", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        var addresses = person.get('addresses');

        person.set('addresses', people[0].addresses);

        assert.ok(!addresses.get('hasDirtyAttributes'), "fragment is clean");
        assert.ok(!person.get('hasDirtyAttributes'), "owner record is clean");
      });
    });
  });

  (0, _qunit.test)("adding a fragment to a fragment array dirties the fragment array and owner record", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        var addresses = person.get('addresses');

        addresses.createFragment('address', {
          street: "1 Dungeon Cell",
          city: "King's Landing",
          region: "Crownlands",
          country: "Westeros"
        });

        assert.ok(addresses.get('hasDirtyAttributes'), "fragment array is dirty");
        assert.ok(person.get('hasDirtyAttributes'), "owner record is dirty");
      });
    });
  });

  (0, _qunit.test)("removing a fragment from a fragment array dirties the fragment array and owner record", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        var addresses = person.get('addresses');

        addresses.removeObject(addresses.get('firstObject'));

        assert.ok(addresses.get('hasDirtyAttributes'), "fragment array is dirty");
        assert.ok(person.get('hasDirtyAttributes'), "owner record is dirty");
      });
    });
  });

  (0, _qunit.test)("reordering a fragment array dirties the fragment array and owner record", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        var addresses = person.get('addresses');
        var length = addresses.get('length');

        var address = addresses.popObject();
        addresses.unshiftObject(address);

        assert.equal(addresses.get('length'), length, "fragment array length is maintained");
        assert.ok(addresses.get('hasDirtyAttributes'), "fragment array is dirty");
        assert.ok(person.get('hasDirtyAttributes'), "owner record is dirty");
      });
    });
  });

  (0, _qunit.test)("restoring a fragment array to its original order returns the fragment array owner record to a clean state", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        var addresses = person.get('addresses');

        var address = addresses.popObject();
        addresses.pushObject(address);

        assert.ok(!addresses.get('hasDirtyAttributes'), "fragment array is clean");
        assert.ok(!person.get('hasDirtyAttributes'), "owner record is clean");
      });
    });
  });

  (0, _qunit.test)("restoring a fragment array to its original order when the owner record was dirty returns the fragment array to a clean state and maintains the owner record's dirty state", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        var addresses = person.get('addresses');

        // Dirty the owner record
        person.set('title', 'Hand of the King');

        var address = addresses.popObject();
        addresses.pushObject(address);

        assert.ok(!addresses.get('hasDirtyAttributes'), "fragment array is clean");
        assert.ok(person.get('hasDirtyAttributes'), "owner record is still dirty");
      });
    });
  });

  (0, _qunit.test)("changing a fragment property in a fragment array dirties the fragment, fragment array, and owner record", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        var addresses = person.get('addresses');
        var address = addresses.get('firstObject');

        address.set('street', '2 Sky Cell');

        assert.ok(address.get('hasDirtyAttributes'), "fragment is dirty");
        assert.ok(addresses.get('hasDirtyAttributes'), "fragment array is dirty");
        assert.ok(person.get('hasDirtyAttributes'), "owner record is dirty");
      });
    });
  });

  (0, _qunit.test)("restoring a fragment in a fragment array property to its original state returns the fragment, fragment array, and owner record to a clean state", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        var addresses = person.get('addresses');
        var address = addresses.get('firstObject');

        address.set('street', '2 Sky Cell');
        address.set('street', '1 Sky Cell');

        assert.ok(!address.get('hasDirtyAttributes'), "fragment is clean");
        assert.ok(!addresses.get('hasDirtyAttributes'), "fragment array is clean");
        assert.ok(!person.get('hasDirtyAttributes'), "owner record is clean");
      });
    });
  });

  (0, _qunit.test)("restoring a fragment in a fragment array property to its original state when the fragment array was dirty returns the fragment to a clean state and maintains the fragment array and owner record's dirty state", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        var addresses = person.get('addresses');
        var address = addresses.get('firstObject');

        // Dirty the record array
        addresses.popObject();

        address.set('street', '2 Sky Cell');
        address.set('street', '1 Sky Cell');

        assert.ok(!address.get('hasDirtyAttributes'), "fragment is clean");
        assert.ok(addresses.get('hasDirtyAttributes'), "fragment array is still dirty");
        assert.ok(person.get('hasDirtyAttributes'), "owner record is dirty");
      });
    });
  });

  (0, _qunit.test)("restoring a fragment in a fragment array property to its original state when the owner record was dirty returns the fragment and fragment array to a clean state maintains the owner record's dirty state", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        var addresses = person.get('addresses');
        var address = addresses.get('firstObject');

        address.set('street', '2 Sky Cell');
        address.set('street', '1 Sky Cell');

        // Dirty the owner record
        person.set('title', 'Master of Coin');

        assert.ok(!address.get('hasDirtyAttributes'), "fragment is clean");
        assert.ok(!addresses.get('hasDirtyAttributes'), "fragment array is clean");
        assert.ok(person.get('hasDirtyAttributes'), "owner record is still dirty");
      });
    });
  });

  (0, _qunit.test)("rolling back the owner record returns all fragments in a fragment array property, the fragment array, and owner record to a clean state", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        var addresses = person.get('addresses');
        var address = addresses.get('firstObject');

        // Dirty the owner record, fragment array, and a fragment
        person.set('title', 'Warden of the West');
        addresses.popObject();
        address.set('street', '2 Sky Cell');

        person.rollbackAttributes();

        assert.ok(!address.get('hasDirtyAttributes'), "fragment is clean");
        assert.ok(!addresses.get('hasDirtyAttributes'), "fragment array is clean");
        assert.ok(!person.get('hasDirtyAttributes'), "owner record is clean");
      });
    });
  });

  (0, _qunit.test)("rolling back the owner record returns all values in an array property, the array, and the owner record to a clean state", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        var titles = person.get('titles');
        var values = titles.toArray();

        // Dirty the primitive array
        titles.popObject();
        titles.unshiftObject('Giant of Lannister');

        person.rollbackAttributes();

        assert.deepEqual(values, person.get('titles').toArray(), "primitive values are reset");
        assert.ok(!titles.get('hasDirtyAttributes'), "fragment array is clean");
        assert.ok(!person.get('hasDirtyAttributes'), "owner record is clean");
      });
    });
  });

  (0, _qunit.test)("rolling back a fragment array returns all fragments, the fragment array, and the owner record to a clean state", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        var addresses = person.get('addresses');
        var address = addresses.get('firstObject');

        // Dirty the fragment array and a fragment
        addresses.popObject();
        address.set('street', '2 Sky Cell');

        addresses.rollbackAttributes();

        assert.ok(!address.get('hasDirtyAttributes'), "fragment is clean");
        assert.ok(!addresses.get('hasDirtyAttributes'), "fragment array is clean");
        assert.ok(!person.get('hasDirtyAttributes'), "owner record is clean");
      });
    });
  });

  (0, _qunit.test)("rolling back a fragment array when the owner record is dirty returns all fragments and the fragment array to a clean state and retain's the owner record's dirty state", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        var addresses = person.get('addresses');
        var address = addresses.get('firstObject');

        // Dirty the owner record, fragment array, and a fragment
        person.set('title', 'Lord of the Westerlands');
        addresses.popObject();
        address.set('street', '2 Sky Cell');

        addresses.rollbackAttributes();

        assert.ok(!address.get('hasDirtyAttributes'), "fragment is clean");
        assert.ok(!addresses.get('hasDirtyAttributes'), "fragment array is clean");
        assert.ok(person.get('hasDirtyAttributes'), "owner record is still dirty");
      });
    });
  });

  (0, _qunit.test)("rolling back a fragment in a fragment array property returns the fragment, fragment array, and owner record to a clean states", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        var addresses = person.get('addresses');
        var address = addresses.get('firstObject');

        // Dirty a fragment
        address.set('street', '2 Sky Cell');

        address.rollbackAttributes();

        assert.ok(!address.get('hasDirtyAttributes'), "fragment is clean");
        assert.ok(!addresses.get('hasDirtyAttributes'), "fragment array is clean");
        assert.ok(!person.get('hasDirtyAttributes'), "owner record is clean");
      });
    });
  });

  (0, _qunit.test)("rolling back a fragment in a fragment array property when the fragment array is dirty returns the fragment to a clean state and maintains the fragment array and owner record's dirty state", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        var addresses = person.get('addresses');
        var address = addresses.get('firstObject');

        // Dirty fragment array, and a fragment
        addresses.popObject();
        address.set('street', '2 Sky Cell');

        address.rollbackAttributes();

        assert.ok(!address.get('hasDirtyAttributes'), "fragment is clean");
        assert.ok(addresses.get('hasDirtyAttributes'), "fragment array is still dirty");
        assert.ok(person.get('hasDirtyAttributes'), "owner record is still dirty");
      });
    });
  });

  (0, _qunit.test)("rolling back a fragment in a fragment array property when the owner record is dirty returns the fragment and fragment array to a clean state and maintains the owner record's dirty state", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        var addresses = person.get('addresses');
        var address = addresses.get('firstObject');

        // Dirty the owner record, and a fragment
        person.set('title', 'Lord of Casterly Rock');
        address.set('street', '2 Sky Cell');

        address.rollbackAttributes();

        assert.ok(!address.get('hasDirtyAttributes'), "fragment is clean");
        assert.ok(!addresses.get('hasDirtyAttributes'), "fragment array is clean");
        assert.ok(person.get('hasDirtyAttributes'), "owner record is still dirty");
      });
    });
  });

  (0, _qunit.test)("a fragment array property that is set to null can be rolled back", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        var addresses = person.get('addresses');

        person.set('addresses', null);

        assert.ok(person.get('hasDirtyAttributes'), "owner record is dirty");

        person.rollbackAttributes();

        assert.equal(person.get('addresses'), addresses, "property is restored");
        assert.ok(!addresses.get('hasDirtyAttributes'), "fragment array is clean");
        assert.ok(!person.get('hasDirtyAttributes'), "owner record is clean");
      });
    });
  });

  (0, _qunit.test)("a fragment array property that is null can be rolled back", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        var hobbies = person.get('hobbies');

        assert.equal(hobbies, null, "property is null");

        person.set('hobbies', [store.createFragment('hobby', {
          name: 'guitar'
        })]);

        assert.ok(person.get('hasDirtyAttributes'), "owner record is dirty");

        person.rollbackAttributes();

        assert.equal(person.get('hobbies'), null, "property is null again");
        assert.ok(!person.get('hasDirtyAttributes'), "owner record is clean");
      });
    });
  });

  (0, _qunit.test)("a fragment array property that is empty can be rolled back", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {}
        }
      });

      return store.find('person', 1).then(function (person) {
        var addresses = person.get('addresses');

        assert.ok(_ember['default'].isArray(addresses) && _ember['default'].isEmpty(addresses), "property is an empty array");

        person.set('addresses', [store.createFragment('address', {
          street: "1 Spear Tower",
          city: "Sun Spear",
          region: "Dorne",
          country: "Westeros"
        })]);

        assert.ok(person.get('hasDirtyAttributes'), "owner record is dirty");

        person.rollbackAttributes();

        assert.ok(_ember['default'].isArray(person.get('addresses')) && _ember['default'].isEmpty(person.get('addresses')), "property is an empty array again");
        assert.ok(!person.get('hasDirtyAttributes'), "owner record is clean");
      });
    });
  });

  (0, _qunit.test)("pushing a fragment update doesn't cause it to become dirty", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        assert.ok(!person.get('hasDirtyAttributes'), "person record is not dirty");

        store.push({
          data: {
            type: 'person',
            id: 1,
            attributes: {
              name: { first: "Jamie" }
            }
          }
        });

        assert.equal(person.get('name.first'), "Jamie", "first name updated");
        assert.equal(person.get('name.last'), "Lannister", "last name is the same");
        assert.ok(!person.get('hasDirtyAttributes'), "person record is not dirty");
      });
    });
  });

  (0, _qunit.test)("pushing a fragment array update doesn't cause it to become dirty", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        assert.ok(!person.get('hasDirtyAttributes'), "person record is not dirty");

        store.push({
          data: {
            type: 'person',
            id: 1,
            attributes: {
              addresses: [
              // Yeah, this is pretty weird...
              {}, {
                street: "1 Dungeon Cell"
              }]
            }
          }
        });

        assert.equal(person.get('addresses.lastObject.street'), "1 Dungeon Cell", "street updated");
        assert.equal(person.get('addresses.lastObject.city'), "King's Landing", "city is the same");
        assert.ok(!person.get('hasDirtyAttributes'), "person record is not dirty");
      });
    });
  });
});
define('dummy/tests/integration/dependent_state_test.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - integration');
  QUnit.test('integration/dependent_state_test.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/dependent_state_test.js should pass jshint.');
  });
});
define('dummy/tests/integration/nested_test', ['exports', 'ember', 'ember-data-model-fragments', 'ember-data', 'qunit', 'dummy/tests/helpers/module-for-acceptance', 'dummy/models/order', 'dummy/models/product'], function (exports, _ember, _emberDataModelFragments, _emberData, _qunit, _dummyTestsHelpersModuleForAcceptance, _dummyModelsOrder, _dummyModelsProduct) {

  var store, adapter, application;

  (0, _dummyTestsHelpersModuleForAcceptance['default'])("integration - Nested fragments", {
    beforeEach: function beforeEach() {
      application = this.application;
      store = application.__container__.lookup('service:store');
      adapter = store.get('defaultAdapter');
      //expectNoDeprecation();
    },

    afterEach: function afterEach() {
      store = null;
      adapter = null;
      application = null;
    }
  });

  (0, _qunit.test)("`DS.hasManyFragment` properties can be nested", function (assert) {
    var data = {
      info: {
        name: 'Tyrion Lannister',
        notes: ['smart', 'short']
      },
      orders: [{
        amount: '799.98',
        products: [{
          name: 'Tears of Lys',
          sku: 'poison-bd-32',
          price: '499.99'
        }, {
          name: 'The Strangler',
          sku: 'poison-md-24',
          price: '299.99'
        }]
      }, {
        amount: '10999.99',
        products: [{
          name: 'Lives of Four Kings',
          sku: 'old-book-32',
          price: '10999.99'
        }]
      }]
    };

    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'user',
          id: 1,
          attributes: _ember['default'].copy(data, true)
        }
      });

      adapter.updateRecord = function () {
        var payload = _ember['default'].copy(data, true);

        payload.id = 1;
        payload.orders[0].products.splice(0, 1);

        return _ember['default'].RSVP.resolve(payload);
      };

      return store.find('user', 1).then(function (user) {
        assert.equal(user.get('orders.firstObject.products.firstObject.name'), 'Tears of Lys', "nested fragment array properties are converted properly");

        var product = user.get('orders.firstObject.products.firstObject');

        product.set('price', '1.99');
        assert.ok(user.get('hasDirtyAttributes'), "dirty state propagates to owner");

        user.rollbackAttributes();
        assert.equal(product.get('price'), '499.99', "rollbackAttributes cascades to nested fragments");
        assert.ok(!user.get('hasDirtyAttributes'), "dirty state is reset");

        user.get('orders.firstObject.products').removeAt(0);
        assert.ok(user.get('hasDirtyAttributes'), "dirty state propagates to owner");

        return user.save();
      }).then(function (user) {
        assert.ok(!user.get('hasDirtyAttributes'), "owner record is clean");
        assert.equal(user.get('orders.firstObject.products.length'), 1, "fragment array length is correct");
      });
    });
  });

  (0, _qunit.test)("Fragments can be created with nested object literals", function (assert) {
    _ember['default'].run(function () {
      var data = {
        info: {
          name: 'Tyrion Lannister',
          notes: ['smart', 'short']
        },
        orders: [{
          amount: '799.98',
          products: [{
            name: 'Tears of Lys',
            sku: 'poison-bd-32',
            price: '499.99'
          }, {
            name: 'The Strangler',
            sku: 'poison-md-24',
            price: '299.99'
          }]
        }, {
          amount: '10999.99',
          products: [{
            name: 'Lives of Four Kings',
            sku: 'old-book-32',
            price: '10999.99'
          }]
        }]
      };

      var user = store.createRecord('user', data);
      var orders = user.get('orders');

      assert.equal(orders.get('length'), 2, "fragment array length is correct");
      assert.ok(orders.get('firstObject') instanceof _dummyModelsOrder['default'], "fragment instances are created");
      assert.equal(orders.get('firstObject.amount'), data.orders[0].amount, "fragment properties are correct");
      assert.equal(orders.get('firstObject.products.length'), 2, "nested fragment array length is correct");
      assert.ok(orders.get('firstObject.products.firstObject') instanceof _dummyModelsProduct['default'], "nested fragment instances are created");
      assert.equal(orders.get('firstObject.products.firstObject.name'), data.orders[0].products[0].name, "nested fragment properties are correct");
    });
  });

  (0, _qunit.test)("Nested fragments can have default values", function (assert) {
    _ember['default'].run(function () {
      var defaultInfo = {
        notes: ['dangerous', 'sorry']
      };
      var defaultOrders = [{
        amount: '1499.99',
        products: [{
          name: 'Live Manticore',
          sku: 'manticore-lv-2',
          price: '1499.99'
        }]
      }];

      var Assassin = _emberData['default'].Model.extend({
        info: _emberDataModelFragments['default'].fragment("info", { defaultValue: defaultInfo }),
        orders: _emberDataModelFragments['default'].fragmentArray("order", { defaultValue: defaultOrders })
      });

      application.register('model:assassin', Assassin);

      var user = store.createRecord('assassin');

      assert.ok(user.get('info'), "a nested fragment is created with the default value");
      assert.deepEqual(user.get('info.notes').toArray(), defaultInfo.notes, "a doubly nested fragment array is created with the default value");
      assert.ok(user.get('orders.firstObject'), "a nested fragment array is created with the default value");
      assert.equal(user.get('orders.firstObject.amount'), defaultOrders[0].amount, "a nested fragment is created with the default value");
      assert.equal(user.get('orders.firstObject.products.firstObject.name'), defaultOrders[0].products[0].name, "a nested fragment is created with the default value");
    });
  });

  (0, _qunit.test)("Nested fragments can be copied", function (assert) {
    var data = {
      info: {
        name: 'Petyr Baelish',
        notes: ['smart', 'despicable']
      },
      orders: [{
        recurring: true,
        product: {
          name: 'City Watch',
          sku: 'bribe-3452',
          price: '11099.99'
        }
      }]
    };

    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'user',
          id: 1,
          attributes: _ember['default'].copy(data, true)
        }
      });

      return store.find('user', 1).then(function (user) {
        var info = user.get('info').copy();

        assert.deepEqual(info.get('notes').toArray(), data.info.notes, 'nested fragment arrays are copied');
        assert.ok(info.get('notes') !== user.get('info.notes'), 'nested fragment array copies are new fragment arrays');

        var orders = user.get('orders').copy();
        var order = orders.objectAt(0);

        assert.equal(order.get('recurring'), data.orders[0].recurring, 'nested fragments are copied');
        assert.ok(order !== user.get('orders.firstObject'), 'nested fragment copies are new fragments');

        var product = order.get('product');

        assert.equal(product.get('name'), data.orders[0].product.name, 'nested fragments are copied');
        assert.ok(product !== user.get('orders.firstObject.product'), 'nested fragment copies are new fragments');
      });
    });
  });
});
define('dummy/tests/integration/nested_test.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - integration');
  QUnit.test('integration/nested_test.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/nested_test.js should pass jshint.');
  });
});
define('dummy/tests/integration/save_test', ['exports', 'ember', 'ember-data-model-fragments', 'ember-data', 'qunit', 'dummy/tests/helpers/module-for-acceptance'], function (exports, _ember, _emberDataModelFragments, _emberData, _qunit, _dummyTestsHelpersModuleForAcceptance) {
  var store, adapter, application;

  (0, _dummyTestsHelpersModuleForAcceptance['default'])("integration - Persistence", {
    beforeEach: function beforeEach() {
      application = this.application;
      store = application.__container__.lookup('service:store');
      adapter = store.get('defaultAdapter');
      //expectNoDeprecation();
    },

    afterEach: function afterEach() {
      store = null;
      adapter = null;
      application = null;
    }
  });

  (0, _qunit.test)("persisting the owner record in a clean state maintains clean state", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: "Tyrion",
              last: "Lannister"
            },
            addresses: [{
              street: "1 Sky Cell",
              city: "Eyre",
              region: "Vale of Arryn",
              country: "Westeros"
            }]
          }
        }
      });

      adapter.updateRecord = function () {
        return _ember['default'].RSVP.resolve();
      };

      return store.find('person', 1).then(function (person) {
        return person.save();
      }).then(function (person) {
        var name = person.get('name');
        var addresses = person.get('addresses');

        assert.ok(!name.get('hasDirtyAttributes'), "fragment is clean");
        assert.ok(!addresses.isAny('hasDirtyAttributes'), "all fragment array fragments are clean");
        assert.ok(!addresses.get('hasDirtyAttributes'), "fragment array is clean");
        assert.ok(!person.get('hasDirtyAttributes'), "owner record is clean");
      });
    });
  });

  (0, _qunit.test)("persisting the owner record when a fragment is dirty moves owner record, fragment array, and all fragments into clean state", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: "Eddard",
              last: "Stark"
            },
            addresses: [{
              street: "1 Great Keep",
              city: "Winterfell",
              region: "North",
              country: "Westeros"
            }]
          }
        }
      });

      adapter.updateRecord = function () {
        return _ember['default'].RSVP.resolve();
      };

      return store.find('person', 1).then(function (person) {
        var name = person.get('name');
        var address = person.get('addresses.firstObject');

        name.set('first', 'Arya');
        address.set('street', '1 Godswood');

        return person.save();
      }).then(function (person) {
        var name = person.get('name');
        var addresses = person.get('addresses');
        var address = addresses.get('firstObject');

        assert.equal(name.get('first'), 'Arya', "change is persisted");
        assert.equal(address.get('street'), '1 Godswood', "fragment array change is persisted");
        assert.ok(!name.get('hasDirtyAttributes'), "fragment is clean");
        assert.ok(!addresses.isAny('hasDirtyAttributes'), "all fragment array fragments are clean");
        assert.ok(!addresses.get('hasDirtyAttributes'), "fragment array is clean");
        assert.ok(!person.get('hasDirtyAttributes'), "owner record is clean");
      });
    });
  });

  (0, _qunit.test)("persisting a new owner record moves the owner record, fragment array, and all fragments into clean state", function (assert) {
    _ember['default'].run(function () {
      var data = {
        name: {
          first: "Daenerys",
          last: "Targaryen"
        },
        addresses: [store.createFragment('address', {
          street: "1 Stone Drum",
          city: "Dragonstone",
          region: "Crownlands",
          country: "Westeros"
        })]
      };

      var person = store.createRecord('person');
      person.set('name', store.createFragment('name', data.name));
      person.set('addresses', data.addresses);

      adapter.createRecord = function () {
        var payload = _ember['default'].copy(data, true);

        payload.id = 3;

        return _ember['default'].RSVP.resolve(payload);
      };

      return person.save().then(function (person) {
        var name = person.get('name');
        var addresses = person.get('addresses');

        assert.ok(!name.get('hasDirtyAttributes'), "fragment is clean");
        assert.ok(!addresses.isAny('hasDirtyAttributes'), "all fragment array fragments are clean");
        assert.ok(!addresses.get('hasDirtyAttributes'), "fragment array is clean");
        assert.ok(!person.get('hasDirtyAttributes'), "owner record is clean");
      });
    });
  });

  (0, _qunit.test)("a new record can be persisted with null fragments", function (assert) {
    _ember['default'].run(function () {
      var person = store.createRecord('person');

      assert.equal(person.get('name'), null, "fragment property is null");
      assert.equal(person.get('hobbies'), null, "fragment array property is null");

      adapter.createRecord = function () {
        var payload = { id: 1 };

        return _ember['default'].RSVP.resolve(payload);
      };

      return person.save().then(function (person) {
        assert.equal(person.get('name'), null, "fragment property is still null");
        assert.equal(person.get('hobbies'), null, "fragment array property is still null");
        assert.ok(!person.get('hasDirtyAttributes'), "owner record is clean");
      });
    });
  });

  (0, _qunit.test)("the adapter can update fragments on save", function (assert) {
    var data = {
      name: {
        first: "Eddard",
        last: "Stark"
      },
      addresses: [{
        street: "1 Great Keep",
        city: "Winterfell",
        region: "North",
        country: "Westeros"
      }]
    };

    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: data
        }
      });

      adapter.updateRecord = function () {
        var payload = _ember['default'].copy(data, true);

        payload.id = 1;
        payload.name.first = 'Ned';
        payload.addresses[0].street = '1 Godswood';

        return _ember['default'].RSVP.resolve(payload);
      };

      return store.find('person', 1).then(function (person) {
        return person.save();
      }).then(function (person) {
        var name = person.get('name');
        var addresses = person.get('addresses');

        assert.ok(!name.get('hasDirtyAttributes'), "fragment is clean");
        assert.ok(!addresses.isAny('hasDirtyAttributes'), "all fragment array fragments are clean");
        assert.ok(!addresses.get('hasDirtyAttributes'), "fragment array is clean");
        assert.ok(!person.get('hasDirtyAttributes'), "owner record is clean");
        assert.equal(name.get('first'), 'Ned', "fragment correctly updated");
        assert.equal(addresses.get('firstObject.street'), '1 Godswood', "fragment array fragment correctly updated");
      });
    });
  });

  (0, _qunit.test)("existing fragments are updated on save", function (assert) {
    var data = {
      name: {
        first: "Eddard",
        last: "Stark"
      },
      addresses: [{
        street: "1 Great Keep",
        city: "Winterfell",
        region: "North",
        country: "Westeros"
      }]
    };

    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: data
        }
      });

      adapter.updateRecord = function () {
        var payload = _ember['default'].copy(data, true);

        payload.id = 1;
        payload.name.first = 'Ned';
        payload.addresses[0].street = '1 Godswood';
        payload.addresses.unshift({
          street: "1 Red Keep",
          city: "Kings Landing",
          region: "Crownlands",
          country: "Westeros"
        });

        return _ember['default'].RSVP.resolve(payload);
      };

      var name, addresses, address;

      return store.find('person', 1).then(function (person) {
        name = person.get('name');
        addresses = person.get('addresses');
        address = addresses.get('firstObject');
        return person.save();
      }).then(function () {
        assert.equal(name.get('first'), 'Ned', "fragment correctly updated");
        assert.equal(address.get('street'), '1 Red Keep', "fragment array fragment correctly updated");
        assert.equal(addresses.get('lastObject.street'), '1 Godswood', "fragment array fragment correctly updated");
        assert.equal(addresses.get('length'), 2, "fragment array fragment correctly updated");
      });
    });
  });

  (0, _qunit.test)("newly created fragments are updated on save", function (assert) {
    var data = {
      name: {
        first: "Eddard",
        last: "Stark"
      },
      addresses: [{
        street: "1 Great Keep",
        city: "Winterfell",
        region: "North",
        country: "Westeros"
      }]
    };

    _ember['default'].run(function () {
      adapter.createRecord = function () {
        var payload = _ember['default'].copy(data, true);

        payload.id = 1;
        payload.name.first = 'Ned';
        payload.addresses[0].street = '1 Godswood';
        payload.addresses.unshift({
          street: "1 Red Keep",
          city: "Kings Landing",
          region: "Crownlands",
          country: "Westeros"
        });

        return _ember['default'].RSVP.resolve(payload);
      };

      var person = store.createRecord('person');
      var name = store.createFragment('name', _ember['default'].copy(data.name));
      var address = store.createFragment('address', _ember['default'].copy(data.addresses[0]));

      person.set('name', name);
      person.set('addresses', [address]);

      var addresses = person.get('addresses');

      return person.save().then(function () {
        assert.equal(name.get('first'), 'Ned', "fragment correctly updated");
        assert.equal(address.get('street'), '1 Red Keep', "fragment array fragment correctly updated");
        assert.equal(addresses.get('lastObject.street'), '1 Godswood', "fragment array fragment correctly updated");
        assert.equal(addresses.get('length'), 2, "fragment array fragment correctly updated");
      });
    });
  });

  (0, _qunit.test)("the adapter can update fragments on reload", function (assert) {
    var data = {
      name: {
        first: "Brandon",
        last: "Stark"
      },
      addresses: [{
        street: "1 Great Keep",
        city: "Winterfell",
        region: "North",
        country: "Westeros"
      }]
    };

    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: data
        }
      });

      adapter.findRecord = function () {
        var payload = _ember['default'].copy(data, true);

        payload.id = 1;
        payload.name.first = 'Bran';
        payload.addresses[0].street = '1 Broken Tower';

        return _ember['default'].RSVP.resolve(payload);
      };

      return store.find('person', 1).then(function (person) {
        // Access values that will change to prime CP cache
        person.get('name.first');
        person.get('addresses.firstObject.street');

        return person.reload();
      }).then(function (person) {
        var name = person.get('name');
        var addresses = person.get('addresses');

        assert.equal(name.get('first'), 'Bran', "fragment correctly updated");
        assert.equal(addresses.get('firstObject.street'), '1 Broken Tower', "fragment array fragment correctly updated");
      });
    });
  });

  /*
    Currently in certain annoying cases in Ember, including aliases or proxies that are actively observed,
    CPs are consumed as soon as they are changed. If we are not careful, this can cause infinite loops when
    updating existing fragment data
  */
  (0, _qunit.test)("the adapter can update fragments without infinite loops when CPs are eagerly consumed", function (assert) {
    var data = {
      name: {
        first: "Brandon",
        last: "Stark"
      }
    };

    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: data
        }
      });

      return store.find('person', 1).then(function (person) {
        var personProxy = _ember['default'].ObjectProxy.create({ content: person });

        _ember['default'].addObserver(personProxy, 'name.first', function () {});
        personProxy.get('name.first');

        store.push({
          data: {
            type: 'person',
            id: 1,
            attributes: data
          }
        });

        assert.equal(person.get('name.first'), 'Brandon');
      });
    });
  });

  // TODO: The data in the adapter response is not actually changing here, which
  // means that the property actually _shouldn't_ be notified. Doing so requires
  // value diffing of deserialized model data, which means either saving a copy of
  // the data before giving it to the fragment
  (0, _qunit.test)("fragment array properties are notified on save", function (assert) {
    // The extra assertion comes from deprecation checking
    assert.expect(2);

    var data = {
      name: {
        first: "Eddard",
        last: "Stark"
      },
      addresses: [{
        street: "1 Great Keep",
        city: "Winterfell",
        region: "North",
        country: "Westeros"
      }]
    };

    var PersonObserver = _ember['default'].Object.extend({
      person: null,
      observer: _ember['default'].observer('person.addresses.[]', function () {
        assert.ok(true, "The array change was observed");
      })
    });

    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: data
        }
      });

      adapter.updateRecord = function () {
        var payload = _ember['default'].copy(data, true);

        payload.id = 1;

        return _ember['default'].RSVP.resolve(payload);
      };

      return store.find('person', 1).then(function (person) {
        PersonObserver.create({ person: person });
        return person.save();
      });
    });
  });

  (0, _qunit.test)("fragment array properties are notifed on reload", function (assert) {
    // The extra assertion comes from deprecation checking
    assert.expect(2);

    var Army = _emberData['default'].Model.extend({
      name: _emberData['default'].attr('string'),
      soldiers: _emberDataModelFragments['default'].array()
    });

    application.register('model:army', Army);

    var data = {
      name: "Golden Company",
      soldiers: ["Aegor Rivers", "Jon Connington", "Tristan Rivers"]
    };

    var ArmyObserver = _ember['default'].Object.extend({
      army: null,
      observer: _ember['default'].observer('army.soldiers.[]', function () {
        assert.equal(this.get('army.soldiers.length'), 2, "The array change to was observed");
      })
    });

    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'army',
          id: 1,
          attributes: data
        }
      });

      adapter.findRecord = function () {
        var payload = _ember['default'].copy(data, true);

        payload.id = 1;
        payload.soldiers.shift();

        return _ember['default'].RSVP.resolve(payload);
      };

      return store.find('army', 1).then(function (army) {
        ArmyObserver.create({ army: army });
        return army.reload();
      });
    });
  });
});
define('dummy/tests/integration/save_test.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - integration');
  QUnit.test('integration/save_test.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/save_test.js should pass jshint.');
  });
});
define('dummy/tests/models/address.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models');
  QUnit.test('models/address.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/address.js should pass jshint.');
  });
});
define('dummy/tests/models/animal.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models');
  QUnit.test('models/animal.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/animal.js should pass jshint.');
  });
});
define('dummy/tests/models/elephant.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models');
  QUnit.test('models/elephant.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/elephant.js should pass jshint.');
  });
});
define('dummy/tests/models/hobby.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models');
  QUnit.test('models/hobby.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/hobby.js should pass jshint.');
  });
});
define('dummy/tests/models/house.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models');
  QUnit.test('models/house.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/house.js should pass jshint.');
  });
});
define('dummy/tests/models/info.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models');
  QUnit.test('models/info.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/info.js should pass jshint.');
  });
});
define('dummy/tests/models/lion.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models');
  QUnit.test('models/lion.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/lion.js should pass jshint.');
  });
});
define('dummy/tests/models/name.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models');
  QUnit.test('models/name.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/name.js should pass jshint.');
  });
});
define('dummy/tests/models/order.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models');
  QUnit.test('models/order.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/order.js should pass jshint.');
  });
});
define('dummy/tests/models/person.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models');
  QUnit.test('models/person.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/person.js should pass jshint.');
  });
});
define('dummy/tests/models/product.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models');
  QUnit.test('models/product.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/product.js should pass jshint.');
  });
});
define('dummy/tests/models/user.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models');
  QUnit.test('models/user.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/user.js should pass jshint.');
  });
});
define('dummy/tests/models/zoo.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - models');
  QUnit.test('models/zoo.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'models/zoo.js should pass jshint.');
  });
});
define('dummy/tests/router.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - .');
  QUnit.test('router.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'router.js should pass jshint.');
  });
});
define('dummy/tests/test-helper', ['exports', 'dummy/tests/helpers/resolver', 'ember-qunit'], function (exports, _dummyTestsHelpersResolver, _emberQunit) {

  (0, _emberQunit.setResolver)(_dummyTestsHelpersResolver['default']);
});
define('dummy/tests/test-helper.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - .');
  QUnit.test('test-helper.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'test-helper.js should pass jshint.');
  });
});
define('dummy/tests/unit/array_property_test', ['exports', 'ember', 'ember-data-model-fragments', 'qunit', 'dummy/tests/helpers/module-for-acceptance', 'dummy/models/person'], function (exports, _ember, _emberDataModelFragments, _qunit, _dummyTestsHelpersModuleForAcceptance, _dummyModelsPerson) {

  var store;

  (0, _dummyTestsHelpersModuleForAcceptance['default'])("unit - `MF.array` property", {
    beforeEach: function beforeEach() {
      store = this.application.__container__.lookup('service:store');
      //expectNoDeprecation();
    }
  });

  (0, _qunit.test)("array properties are converted to an array-ish containing original values", function (assert) {
    var values = ["Hand of the King", "Master of Coin"];

    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            nickName: "Tyrion Lannister",
            titles: values
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        var titles = person.get('titles');

        assert.ok(_ember['default'].isArray(titles), "property is array-like");

        assert.ok(titles.every(function (title, index) {
          return title === values[index];
        }), "each title matches the original value");
      });
    });
  });

  (0, _qunit.test)("null values are allowed", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            nickName: 'Many-Faced God',
            titles: null
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        assert.equal(person.get('titles'), null, "property is null");
      });
    });
  });

  (0, _qunit.test)("setting to null is allowed", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            nickName: "R'hllor",
            titles: ['Lord of Light', 'The Heart of Fire', 'The God of Flame and Shadow']
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        person.set('titles', null);

        assert.equal(person.get('titles'), null, "property is null");
      });
    });
  });

  (0, _qunit.test)("array properties default to an empty array-ish", function (assert) {
    _ember['default'].run(function () {
      var person = store.createRecord('person', {
        nickName: 'Boros Blount'
      });

      assert.deepEqual(person.get('titles').toArray(), [], "default value is correct");
    });
  });

  (0, _qunit.test)("array properties can have default values", function (assert) {
    _ember['default'].run(function () {
      _dummyModelsPerson['default'].reopen({
        titles: _emberDataModelFragments['default'].array({ defaultValue: ['Ser'] })
      });

      var person = store.createRecord('person', {
        nickName: 'Barristan Selmy'
      });

      assert.ok(person.get('titles.length'), 1, "default value length is correct");
      assert.equal(person.get('titles.firstObject'), 'Ser', "default value is correct");
    });
  });

  (0, _qunit.test)("default values can be functions", function (assert) {
    _ember['default'].run(function () {
      _dummyModelsPerson['default'].reopen({
        titles: _emberDataModelFragments['default'].array({ defaultValue: function defaultValue() {
            return ['Viper'];
          } })
      });

      var person = store.createRecord('person', {
        nickName: 'Oberyn Martell'
      });

      assert.ok(person.get('titles.length'), 1, "default value length is correct");
      assert.equal(person.get('titles.firstObject'), 'Viper', "default value is correct");
    });
  });
});
define('dummy/tests/unit/array_property_test.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - unit');
  QUnit.test('unit/array_property_test.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/array_property_test.js should pass jshint.');
  });
});
define("dummy/tests/unit/deprecation_test", ["exports", "dummy/tests/helpers/module-for-acceptance"], function (exports, _dummyTestsHelpersModuleForAcceptance) {

  (0, _dummyTestsHelpersModuleForAcceptance["default"])("unit - Deprecations", {
    setup: function setup() {},

    teardown: function teardown() {}
  });

  // Yay, no deprecations!
});
define('dummy/tests/unit/deprecation_test.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - unit');
  QUnit.test('unit/deprecation_test.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/deprecation_test.js should pass jshint.');
  });
});
define('dummy/tests/unit/fragment_array_property_test', ['exports', 'ember', 'ember-data', 'ember-data-model-fragments', 'qunit', 'dummy/tests/helpers/module-for-acceptance', 'dummy/models/address'], function (exports, _ember, _emberData, _emberDataModelFragments, _qunit, _dummyTestsHelpersModuleForAcceptance, _dummyModelsAddress) {

  var application, store, people;
  var all = _ember['default'].RSVP.all;

  (0, _dummyTestsHelpersModuleForAcceptance['default'])("unit - `MF.fragmentArray` property", {
    beforeEach: function beforeEach() {
      application = this.application;

      store = application.__container__.lookup('service:store');

      //expectNoDeprecation();

      people = [{
        id: 1,
        nickName: "Tyrion Lannister",
        addresses: [{
          street: "1 Sky Cell",
          city: "Eyre",
          region: "Vale of Arryn",
          country: "Westeros"
        }, {
          street: "1 Tower of the Hand",
          city: "King's Landing",
          region: "Crownlands",
          country: "Westeros"
        }]
      }, {
        id: 2,
        nickName: "Eddard Stark",
        addresses: [{
          street: "1 Great Keep",
          city: "Winterfell",
          region: "North",
          country: "Westeros"
        }]
      }, {
        id: 3,
        nickName: "Jojen Reed",
        addresses: null
      }];
    },

    teardown: function teardown() {
      store = null;
      people = null;
    }
  });

  function pushPerson(id) {
    store.push({
      data: {
        type: 'person',
        id: id,
        attributes: _ember['default'].A(people).findBy('id', id)
      }
    });
  }

  (0, _qunit.test)("properties are instances of `MF.FragmentArray`", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        var addresses = person.get('addresses');

        assert.ok(_ember['default'].isArray(addresses), "property is array-like");
        assert.ok(addresses instanceof _emberDataModelFragments['default'].FragmentArray, "property is an instance of `MF.FragmentArray`");
      });
    });
  });

  (0, _qunit.test)("arrays of object literals are converted into instances of `MF.Fragment`", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        var addresses = person.get('addresses');

        assert.ok(addresses.every(function (address) {
          return address instanceof _dummyModelsAddress['default'];
        }), "each fragment is a `MF.Fragment` instance");
      });
    });
  });

  (0, _qunit.test)("fragments created through the store can be added to the fragment array", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        var addresses = person.get('addresses');
        var length = addresses.get('length');

        var address = store.createFragment('address', {
          street: "1 Dungeon Cell",
          city: "King's Landing",
          region: "Crownlands",
          country: "Westeros"
        });

        addresses.addFragment(address);

        assert.equal(addresses.get('length'), length + 1, "address property size is correct");
        assert.equal(addresses.indexOf(address), length, "new fragment is in correct location");
      });
    });
  });

  (0, _qunit.test)("adding a non-fragment model or object literal throws an error", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        var addresses = person.get('addresses');

        assert.throws(function () {
          var otherPerson = store.createRecord('person');

          addresses.addFragment(otherPerson);
        }, "error is thrown when adding a DS.Model instance");
      });
    });
  });

  (0, _qunit.test)("adding fragments from other records throws an error", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);
      pushPerson(2);

      return all([store.find('person', 1), store.find('person', 2)]).then(function (people) {
        var address = people[0].get('addresses.firstObject');

        assert.throws(function () {
          people[1].get('addresses').addFragment(address);
        }, "error is thrown when adding a fragment from another record");
      });
    });
  });

  (0, _qunit.test)("setting to an array of fragments is allowed", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        var addresses = person.get('addresses');

        var address = store.createFragment('address', {
          street: "1 Dungeon Cell",
          city: "King's Landing",
          region: "Crownlands",
          country: "Westeros"
        });

        person.set('addresses', [address]);

        assert.equal(person.get('addresses'), addresses, "fragment array is the same object");
        assert.equal(person.get('addresses.length'), 1, "fragment array has the correct length");
        assert.equal(person.get('addresses.firstObject'), address, "fragment array contains the new fragment");
      });
    });
  });

  (0, _qunit.test)("defaults to an empty array", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {}
        }
      });

      store.push({
        data: {
          type: 'person',
          id: 2,
          attributes: {}
        }
      });

      return store.find('person', 1).then(function (person) {
        assert.ok(_ember['default'].isArray(person.get('addresses')), "defaults to an array");
        assert.ok(_ember['default'].isEmpty(person.get('addresses')), "default array is empty");

        store.find('person', 2).then(function (person2) {
          assert.ok(person.get('addresses') !== person2.get('addresses'), "default array is unique");
        });
      });
    });
  });

  (0, _qunit.test)("default value can be null", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        assert.equal(person.get('hobbies'), null, "defaults to null");

        var hobbies = [store.createFragment('hobby', {
          name: 'guitar'
        })];

        person.set('hobbies', hobbies);
        assert.equal(person.get('hobbies.length'), 1, "can be set to an array");
      });
    });
  });

  (0, _qunit.test)("null values are allowed", function (assert) {
    _ember['default'].run(function () {
      pushPerson(3);

      return store.find('person', 3).then(function (person) {
        assert.equal(person.get('addresses'), null, "property is null");
      });
    });
  });

  (0, _qunit.test)("setting to null is allowed", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        person.set('addresses', null);

        assert.equal(person.get('addresses'), null, "property is null");
      });
    });
  });

  (0, _qunit.test)("fragments are created from an array of object literals when creating a record", function (assert) {
    _ember['default'].run(function () {
      var address = {
        street: '1 Sea Tower',
        city: 'Pyke',
        region: 'Iron Islands',
        country: 'Westeros'
      };

      var person = store.createRecord('person', {
        name: {
          first: 'Balon',
          last: 'Greyjoy'
        },
        addresses: [address]
      });

      assert.ok(person.get('addresses.firstObject') instanceof _emberDataModelFragments['default'].Fragment, "a `MF.Fragment` instance is created");
      assert.equal(person.get('addresses.firstObject.street'), address.street, "fragment has correct values");
    });
  });

  (0, _qunit.test)("setting a fragment array to an array of to an object literals creates new fragments", function (assert) {
    var address = {
      street: '1 Great Keep',
      city: 'Pyke',
      region: 'Iron Islands',
      country: 'Westeros'
    };

    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: 'Asha',
              last: 'Greyjoy'
            },
            addresses: null
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        person.set('addresses', [address]);

        assert.ok(person.get('addresses.firstObject') instanceof _emberDataModelFragments['default'].Fragment, "a `MF.Fragment` instance is created");
        assert.equal(person.get('addresses.firstObject.street'), address.street, "fragment has correct values");
      });
    });
  });

  (0, _qunit.test)("setting a fragment array to an array of object literals reuses an existing fragments", function (assert) {
    var newAddress = {
      street: '1 Great Keep',
      city: 'Winterfell',
      region: 'North',
      country: 'Westeros'
    };

    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: 'Theon',
              last: 'Greyjoy'
            },
            addresses: [{
              street: '1 Great Keep',
              city: 'Pyke',
              region: 'Iron Islands',
              country: 'Westeros'
            }]
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        var address = person.get('addresses.firstObject');

        person.set('addresses', [newAddress]);

        assert.equal(address, person.get('addresses.firstObject'), "fragment instances are reused");
        assert.equal(person.get('addresses.firstObject.street'), newAddress.street, "fragment has correct values");
      });
    });
  });

  (0, _qunit.test)("setting to an array of non-fragments throws an error", function (assert) {
    _ember['default'].run(function () {
      pushPerson(1);

      return store.find('person', 1).then(function (person) {
        assert.throws(function () {
          person.set('addresses', ['address']);
        }, "error is thrown when setting to an array of non-fragments");
      });
    });
  });

  (0, _qunit.test)("fragments can have default values", function (assert) {
    _ember['default'].run(function () {
      var defaultValue = [{
        street: "1 Throne Room",
        city: "King's Landing",
        region: "Crownlands",
        country: "Westeros"
      }];

      var Throne = _emberData['default'].Model.extend({
        name: _emberData['default'].attr('string'),
        addresses: _emberDataModelFragments['default'].fragmentArray('address', { defaultValue: defaultValue })
      });

      application.register('model:throne', Throne);

      var throne = store.createRecord('throne', { name: 'Iron' });

      assert.equal(throne.get('addresses.firstObject.street'), defaultValue[0].street, "the default value is used when the value has not been specified");

      throne.set('addresses', null);
      assert.equal(throne.get('addresses'), null, "the default value is not used when the value is set to null");

      throne = store.createRecord('throne', { name: 'Iron', addresses: null });
      assert.equal(throne.get('addresses'), null, "the default value is not used when the value is initialized to null");
    });
  });

  (0, _qunit.test)("fragment default values can be functions", function (assert) {
    _ember['default'].run(function () {
      var _defaultValue = [{
        street: "1 Great Keep",
        city: "Winterfell",
        region: "North",
        country: "Westeros"
      }];

      var Sword = _emberData['default'].Model.extend({
        name: _emberData['default'].attr('string'),
        addresses: _emberDataModelFragments['default'].fragmentArray('address', { defaultValue: function defaultValue() {
            return _defaultValue;
          } })
      });

      application.register('model:sword', Sword);

      var sword = store.createRecord('sword', { name: 'Ice' });

      assert.equal(sword.get('addresses.firstObject.street'), _defaultValue[0].street, "the default value is correct");
    });
  });
});
define('dummy/tests/unit/fragment_array_property_test.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - unit');
  QUnit.test('unit/fragment_array_property_test.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/fragment_array_property_test.js should pass jshint.');
  });
});
define('dummy/tests/unit/fragment_array_test', ['exports', 'ember', 'qunit', 'dummy/tests/helpers/module-for-acceptance'], function (exports, _ember, _qunit, _dummyTestsHelpersModuleForAcceptance) {
  var store;

  (0, _dummyTestsHelpersModuleForAcceptance['default'])("unit - `MF.fragmentArray`", {
    beforeEach: function beforeEach() {
      store = this.application.__container__.lookup('service:store');
      //expectNoDeprecation();
    },

    afterEach: function afterEach() {
      store = null;
    }
  });

  (0, _qunit.test)("fragment arrays can be copied", function (assert) {
    var data = {
      names: [{
        first: "Meryn",
        last: "Trant"
      }]
    };

    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: data
        }
      });

      return store.find('person', 1).then(function (person) {
        var copy = person.get('names').copy();

        assert.equal(copy.length, person.get('names.length'), "copy's size is correct");
        assert.equal(copy[0].get('first'), data.names[0].first, "child fragments are copied");
        assert.ok(copy[0] !== person.get('names.firstObject'), "copied fragments are new fragments");
      });
    });
  });

  (0, _qunit.test)("fragments can be created and added through the fragment array", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            names: [{
              first: "Tyrion",
              last: "Lannister"
            }]
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        var fragments = person.get('names');
        var length = fragments.get('length');

        var fragment = fragments.createFragment({
          first: "Hugor",
          last: "Hill"
        });

        assert.equal(fragments.get('length'), length + 1, "property size is correct");
        assert.equal(fragments.indexOf(fragment), length, "new fragment is in correct location");
      });
    });
  });

  (0, _qunit.test)("fragments can be added to the fragment array", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            names: [{
              first: "Tyrion",
              last: "Lannister"
            }]
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        var fragments = person.get('names');
        var length = fragments.get('length');

        var fragment = store.createFragment('name', {
          first: "Yollo"
        });

        fragments.addFragment(fragment);

        assert.equal(fragments.get('length'), length + 1, "property size is correct");
        assert.equal(fragments.indexOf(fragment), length, "fragment is in correct location");
      });
    });
  });

  (0, _qunit.test)("fragments can be removed from the fragment array", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            names: [{
              first: "Arya",
              last: "Stark"
            }]
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        var fragments = person.get('names');
        var fragment = fragments.get('firstObject');
        var length = fragments.get('length');

        fragments.removeFragment(fragment);

        assert.equal(fragments.get('length'), length - 1, "property size is correct");
        assert.ok(!fragments.contains(fragment), "fragment is removed");
      });
    });
  });

  (0, _qunit.test)("changes to array contents change the fragment array 'hasDirtyAttributes' property", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            names: [{
              first: "Aegon",
              last: "Targaryen"
            }, {
              first: "Visenya",
              last: "Targaryen"
            }]
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        var fragments = person.get('names');
        var fragment = fragments.get('firstObject');
        var newFragment = store.createFragment('name', {
          first: 'Rhaenys',
          last: 'Targaryen'
        });

        assert.ok(!fragments.get('hasDirtyAttributes'), "fragment array is initially in a clean state");

        fragments.removeFragment(fragment);

        assert.ok(fragments.get('hasDirtyAttributes'), "fragment array is in dirty state after removal");

        fragments.unshiftObject(fragment);

        assert.ok(!fragments.get('hasDirtyAttributes'), "fragment array is returned to clean state");

        fragments.addFragment(newFragment);

        assert.ok(fragments.get('hasDirtyAttributes'), "fragment array is in dirty state after addition");

        fragments.removeFragment(newFragment);

        assert.ok(!fragments.get('hasDirtyAttributes'), "fragment array is returned to clean state");

        fragments.removeFragment(fragment);
        fragments.addFragment(fragment);

        assert.ok(fragments.get('hasDirtyAttributes'), "fragment array is in dirty state after reordering");

        fragments.removeFragment(fragment);
        fragments.unshiftObject(fragment);

        assert.ok(!fragments.get('hasDirtyAttributes'), "fragment array is returned to clean state");
      });
    });
  });

  (0, _qunit.test)("changes to array contents change the fragment array 'hasDirtyAttributes' property", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            names: [{
              first: "Jon",
              last: "Snow"
            }]
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        var fragments = person.get('names');
        var fragment = fragments.get('firstObject');

        assert.ok(!fragments.get('hasDirtyAttributes'), "fragment array is initially in a clean state");

        fragment.set('last', 'Stark');

        assert.ok(fragments.get('hasDirtyAttributes'), "fragment array in dirty state after change to a fragment");

        fragment.set('last', 'Snow');

        assert.ok(!fragments.get('hasDirtyAttributes'), "fragment array is returned to clean state");
      });
    });
  });

  (0, _qunit.test)("changes to array contents and fragments can be rolled back", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            names: [{
              first: "Catelyn",
              last: "Tully"
            }, {
              first: "Catelyn",
              last: "Stark"
            }]
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        var fragments = person.get('names');
        var fragment = fragments.get('firstObject');

        var originalState = fragments.toArray();

        fragment.set('first', 'Cat');
        fragments.removeFragment(fragments.get('lastObject'));
        fragments.createFragment({
          first: 'Lady',
          last: 'Stonehart'
        });

        fragments.rollbackAttributes();

        assert.ok(!fragments.get('hasDirtyAttributes'), "fragment array is not dirty");
        assert.ok(!fragments.isAny('hasDirtyAttributes'), "all fragments are in clean state");
        assert.deepEqual(fragments.toArray(), originalState, "original array contents is restored");
      });
    });
  });
});
define('dummy/tests/unit/fragment_array_test.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - unit');
  QUnit.test('unit/fragment_array_test.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/fragment_array_test.js should pass jshint.');
  });
});
define('dummy/tests/unit/fragment_owner_property_test', ['exports', 'ember', 'ember-data', 'ember-data-model-fragments', 'qunit', 'dummy/tests/helpers/module-for-acceptance'], function (exports, _ember, _emberData, _emberDataModelFragments, _qunit, _dummyTestsHelpersModuleForAcceptance) {
  var store, application;
  var all = _ember['default'].RSVP.all;

  (0, _dummyTestsHelpersModuleForAcceptance['default'])("unit - `MF.fragmentOwner` property", {
    beforeEach: function beforeEach() {
      application = this.application;
      store = application.__container__.lookup('service:store');
      //expectNoDeprecation();
    },

    afterEach: function afterEach() {
      store = null;
    }
  });

  (0, _qunit.test)("fragments can reference their owner record", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: "Samwell",
              last: "Tarly"
            }
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        var name = person.get('name');

        assert.equal(name.get('person'), person, "fragment owner property is reference to the owner record");
      });
    });
  });

  (0, _qunit.test)("using a fragment owner property on a non-fragment throws an error", function (assert) {
    _ember['default'].run(function () {
      var InvalidModel = _emberData['default'].Model.extend({
        owner: _emberDataModelFragments['default'].fragmentOwner()
      });

      application.register('model:invalidModel', InvalidModel);

      var invalid = store.createRecord('invalidModel');

      assert.throws(function () {
        invalid.get('owner');
      }, /Fragment owner properties can only be used on fragments/, "getting fragment owner on non-fragment throws an error");
    });
  });

  (0, _qunit.test)("attempting to change a fragment's owner record throws an error", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: "Samwell",
              last: "Tarly"
            }
          }
        }
      });

      store.push({
        data: {
          type: 'person',
          id: 2,
          attributes: {
            name: {
              first: "Samwell",
              last: "Tarly"
            }
          }
        }
      });

      return all([store.find('person', 1), store.find('person', 2)]).then(function (people) {
        var name = people[0].get('name');

        assert.throws(function () {
          name.set('person', people[1]);
        }, "setting the owner property throws an error");
      });
    });
  });

  (0, _qunit.test)("fragment owner properties are notified of change", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: "Jeyne",
              last: "Poole"
            }
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        var name = store.createFragment('name', {
          first: 'Arya',
          last: 'Stark'
        });

        assert.ok(!name.get('person'), "fragment owner property is null");

        person.set('name', name);

        assert.equal(name.get('person'), person, "fragment owner property is updated");
      });
    });
  });
});
define('dummy/tests/unit/fragment_owner_property_test.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - unit');
  QUnit.test('unit/fragment_owner_property_test.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/fragment_owner_property_test.js should pass jshint.');
  });
});
define('dummy/tests/unit/fragment_property_test', ['exports', 'ember', 'ember-data', 'ember-data-model-fragments', 'qunit', 'dummy/tests/helpers/module-for-acceptance', 'dummy/models/name'], function (exports, _ember, _emberData, _emberDataModelFragments, _qunit, _dummyTestsHelpersModuleForAcceptance, _dummyModelsName) {
  var store, application;
  var all = _ember['default'].RSVP.all;

  (0, _dummyTestsHelpersModuleForAcceptance['default'])("unit - `MF.fragment` property", {
    beforeEach: function beforeEach() {
      application = this.application;
      store = application.__container__.lookup('service:store');
      //expectNoDeprecation();
    },

    afterEach: function afterEach() {
      store = null;
      application = null;
    }
  });

  (0, _qunit.test)("object literals are converted to instances of `MF.Fragment`", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: "Tyrion",
              last: "Lannister"
            }
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        assert.ok(person.get('name') instanceof _dummyModelsName['default'], "name property is an `MF.Fragment` instance");

        assert.equal(person.get('name.first'), 'Tyrion', "nested properties have original value");
      });
    });
  });

  (0, _qunit.test)("a fragment can be created through the store and set", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {}
        }
      });

      return store.find('person', 1).then(function (person) {
        var name = store.createFragment('name', {
          first: "Davos",
          last: "Seaworth"
        });

        person.set('name', name);

        assert.equal(person.get('name.first'), 'Davos', "new fragment is correctly set");
      });
    });
  });

  (0, _qunit.test)("setting to a non-fragment or object literal throws an error", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {}
        }
      });

      return store.find('person', 1).then(function (person) {
        assert.throws(function () {
          person.set('name', store.createRecord('person'));
        }, "error is thrown when setting non-fragment");
      });
    });
  });

  (0, _qunit.test)("setting fragments from other records throws an error", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: "Roose",
              last: "Bolton"
            }
          }
        }
      });

      store.push({
        data: {
          type: 'person',
          id: 2,
          attributes: {}
        }
      });

      return all([store.find('person', 1), store.find('person', 2)]).then(function (people) {
        assert.throws(function () {
          people[1].set('name', people[0].get('name'));
        }, "error is thrown when setting to a fragment of another record");
      });
    });
  });

  (0, _qunit.test)("null values are allowed", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: null
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        assert.equal(person.get('name'), null, "property is null");
      });
    });
  });

  (0, _qunit.test)("setting to null is allowed", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: "Barristan",
              last: "Selmy"
            }
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        person.set('name', null);
        assert.equal(person.get('name'), null, "property is null");
      });
    });
  });

  (0, _qunit.test)("fragments are created from object literals when creating a record", function (assert) {
    _ember['default'].run(function () {
      var name = {
        first: 'Balon',
        last: 'Greyjoy'
      };

      var person = store.createRecord('person', {
        name: name
      });

      assert.ok(person.get('name') instanceof _emberDataModelFragments['default'].Fragment, "a `MF.Fragment` instance is created");
      assert.equal(person.get('name.first'), name.first, "fragment has correct values");
    });
  });

  (0, _qunit.test)("setting a fragment to an object literal creates a new fragment", function (assert) {
    var name = {
      first: 'Asha',
      last: 'Greyjoy'
    };

    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: null
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        person.set('name', name);

        assert.ok(person.get('name') instanceof _emberDataModelFragments['default'].Fragment, "a `MF.Fragment` instance is created");
        assert.equal(person.get('name.first'), name.first, "fragment has correct values");
      });
    });
  });

  (0, _qunit.test)("setting a fragment to an object literal reuses an existing fragment", function (assert) {
    var newName = {
      first: 'Reek',
      last: null
    };

    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: 'Theon',
              last: 'Greyjoy'
            }
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        var name = person.get('name');

        person.set('name', newName);

        assert.equal(name, person.get('name'), "fragment instances are reused");
        assert.equal(person.get('name.first'), newName.first, "fragment has correct values");
      });
    });
  });

  (0, _qunit.test)("fragments can have default values", function (assert) {
    _ember['default'].run(function () {
      var defaultValue = {
        first: "Iron",
        last: "Victory"
      };

      var Ship = _emberData['default'].Model.extend({
        name: _emberDataModelFragments['default'].fragment("name", { defaultValue: defaultValue })
      });

      application.register('model:ship', Ship);

      var ship = store.createRecord('ship');

      assert.equal(ship.get('name.first'), defaultValue.first, "the default value is used when the value has not been specified");

      ship.set('name', null);
      assert.equal(ship.get('name'), null, "the default value is not used when the value is set to null");

      ship = store.createRecord('ship', { name: null });
      assert.equal(ship.get('name'), null, "the default value is not used when the value is initialized to null");
    });
  });

  (0, _qunit.test)("fragment default values can be functions", function (assert) {
    _ember['default'].run(function () {
      var _defaultValue = {
        first: "Oath",
        last: "Keeper"
      };

      var Sword = _emberData['default'].Model.extend({
        name: _emberDataModelFragments['default'].fragment("name", { defaultValue: function defaultValue() {
            return _defaultValue;
          } })
      });

      application.register('model:sword', Sword);

      var sword = store.createRecord('sword');

      assert.equal(sword.get('name.first'), _defaultValue.first, "the default value is correct");
    });
  });
});
define('dummy/tests/unit/fragment_property_test.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - unit');
  QUnit.test('unit/fragment_property_test.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/fragment_property_test.js should pass jshint.');
  });
});
define('dummy/tests/unit/fragment_test', ['exports', 'ember', 'qunit', 'dummy/tests/helpers/module-for-acceptance'], function (exports, _ember, _qunit, _dummyTestsHelpersModuleForAcceptance) {
  var store;
  var all = _ember['default'].RSVP.all;

  (0, _dummyTestsHelpersModuleForAcceptance['default'])("unit - `MF.Fragment`", {
    beforeEach: function beforeEach() {
      store = this.application.__container__.lookup('service:store');
    },

    afterEach: function afterEach() {
      store = null;
    }
  });

  (0, _qunit.test)("fragments are `Ember.Copyable`", function (assert) {
    _ember['default'].run(function () {
      var fragment = store.createFragment('name');

      assert.ok(_ember['default'].Copyable.detect(fragment), "fragments are copyable");
    });
  });

  (0, _qunit.test)("copied fragments can be added to any record", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: "Jon",
              last: "Snow"
            }
          }
        }
      });

      store.push({
        data: {
          type: 'person',
          id: 2,
          attributes: {}
        }
      });

      return all([store.find('person', 1), store.find('person', 2)]).then(function (people) {
        var copy = people[0].get('name').copy();

        people[1].set('name', copy);

        assert.ok(true, "fragment copies can be assigned to other records");
      });
    });
  });

  (0, _qunit.test)("copying a fragment copies the fragment's properties", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: "Jon",
              last: "Snow"
            }
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        var copy = person.get('name').copy();

        assert.ok(copy.get('first'), "Jon");
        assert.ok(copy.get('last'), "Snow");
      });
    });
  });

  (0, _qunit.test)("fragments are `Ember.Comparable`", function (assert) {
    _ember['default'].run(function () {
      var fragment = store.createFragment('name');

      assert.ok(_ember['default'].Comparable.detect(fragment), "fragments are comparable");
    });
  });

  (0, _qunit.test)("fragments are compared by reference", function (assert) {
    _ember['default'].run(function () {
      var fragment1 = store.createFragment('name', {
        first: "Jon",
        last: "Arryn"
      });
      var fragment2 = store.createFragment('name', {
        first: "Jon",
        last: "Arryn"
      });

      assert.ok(fragment1.compare(fragment1, fragment2) !== 0, "deeply equal objects are not the same");
      assert.ok(fragment1.compare(fragment1, fragment1) === 0, "identical objects are the same");
    });
  });

  (0, _qunit.test)("changes to fragments are indicated in the owner record's `changedAttributes`", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: "Loras",
              last: "Tyrell"
            }
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        var name = person.get('name');

        name.set('last', 'Baratheon');

        assert.equal(person.changedAttributes().name, true, "changed fragments are indicated in the diff object");
      });
    });
  });

  (0, _qunit.test)("fragment properties that are set to null are indicated in the owner record's `changedAttributes`", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: "Rob",
              last: "Stark"
            }
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        person.set('name', null);

        assert.equal(person.changedAttributes().name, true, "null fragments are indicated in the diff object");
      });
    });
  });

  (0, _qunit.test)("changes to attributes can be rolled back", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: "Ramsay",
              last: "Snow"
            }
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        var name = person.get('name');

        name.set('last', 'Bolton');
        name.rollbackAttributes();

        assert.ok(name.get('last', 'Snow'), "fragment properties are restored");
        assert.ok(!name.get('hasDirtyAttributes'), "fragment is in clean state");
      });
    });
  });
});
define('dummy/tests/unit/fragment_test.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - unit');
  QUnit.test('unit/fragment_test.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/fragment_test.js should pass jshint.');
  });
});
define('dummy/tests/unit/polymorphic_test', ['exports', 'ember', 'qunit', 'dummy/tests/helpers/module-for-acceptance', 'dummy/models/animal', 'dummy/models/lion', 'dummy/models/elephant'], function (exports, _ember, _qunit, _dummyTestsHelpersModuleForAcceptance, _dummyModelsAnimal, _dummyModelsLion, _dummyModelsElephant) {
  var store, zoo;

  (0, _dummyTestsHelpersModuleForAcceptance['default'])("unit - Polymorphism", {
    beforeEach: function beforeEach() {
      store = this.application.__container__.lookup('service:store');

      //expectNoDeprecation();

      zoo = {
        name: 'Chilly Zoo',
        city: 'Winterfell',
        star: {
          $type: 'lion',
          name: 'Mittens',
          hasManes: 'true'
        },
        animals: [{
          $type: 'lion',
          name: 'Mittens',
          hasManes: 'true'
        }, {
          $type: 'elephant',
          name: 'Snuitje',
          trunkLength: 4
        }]
      };
    },

    afterEach: function afterEach() {
      store = null;
    }
  });

  (0, _qunit.test)("fragment properties support polymorphism", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'zoo',
          id: 1,
          attributes: zoo
        }
      });

      return store.find('zoo', 1).then(function (zoo) {
        assert.equal(zoo.get("name"), "Chilly Zoo", "zoo name is correct");
        assert.equal(zoo.get("city"), "Winterfell", "zoo city is correct");

        var star = zoo.get("star");
        assert.ok(star instanceof _dummyModelsAnimal['default'], "zoo's star is an animal");
        assert.equal(star.get("name"), "Mittens", "animal name is correct");
        assert.ok(star instanceof _dummyModelsLion['default'], "zoo's star is a lion");
        assert.ok(star.get("hasManes"), "lion has manes");
      });
    });
  });

  (0, _qunit.test)("fragment array properties support polymorphism", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'zoo',
          id: 1,
          attributes: zoo
        }
      });

      return store.find('zoo', 1).then(function (zoo) {
        var animals = zoo.get("animals");
        assert.equal(animals.get("length"), 2);

        var first = animals.objectAt(0);
        assert.ok(first instanceof _dummyModelsAnimal['default']);
        assert.equal(first.get("name"), "Mittens", "first animal's name is correct");
        assert.ok(first instanceof _dummyModelsLion['default']);
        assert.ok(first.get("hasManes"), "lion has manes");

        var second = animals.objectAt(1);
        assert.ok(second instanceof _dummyModelsAnimal['default']);
        assert.equal(second.get("name"), "Snuitje", "second animal's name is correct");
        assert.ok(second instanceof _dummyModelsElephant['default']);
        assert.equal(second.get("trunkLength"), 4, "elephant's trunk length is correct");
      });
    });
  });

  (0, _qunit.test)("fragment property type-checks check the superclass when MODEL_FACTORY_INJECTIONS is enabled", function (assert) {
    var injectionValue = _ember['default'].MODEL_FACTORY_INJECTIONS;
    _ember['default'].MODEL_FACTORY_INJECTIONS = true;

    try {
      _ember['default'].run(function () {
        store.push({
          data: {
            type: 'zoo',
            id: 1,
            attributes: zoo
          }
        });

        zoo = store.createRecord('zoo', { name: 'The World' });
        var animal = store.createFragment('elephant', { name: 'Mr. Pink' });

        zoo.set('star', animal);

        assert.equal(zoo.get('star.name'), animal.get('name'), 'The type check succeeded');
      });
    } finally {
      _ember['default'].MODEL_FACTORY_INJECTIONS = injectionValue;
    }
  });

  (0, _qunit.test)("rolling back a fragment property that was set to null checks the superclass when MODEL_FACTORY_INJECTIONS is enabled", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'zoo',
          id: 1,
          attributes: zoo
        }
      });

      var injectionValue = _ember['default'].MODEL_FACTORY_INJECTIONS;
      _ember['default'].MODEL_FACTORY_INJECTIONS = true;

      return store.find('zoo', 1).then(function (zoo) {
        var animal = zoo.get('star');

        zoo.set('star', null);
        zoo.rollbackAttributes();

        assert.equal(zoo.get('star.name'), animal.get('name'), 'The type check succeeded');
      })['finally'](function () {
        _ember['default'].MODEL_FACTORY_INJECTIONS = injectionValue;
      });
    });
  });

  (0, _qunit.test)("fragment array property type-checks check the superclass when MODEL_FACTORY_INJECTIONS is enabled", function (assert) {
    var injectionValue = _ember['default'].MODEL_FACTORY_INJECTIONS;
    _ember['default'].MODEL_FACTORY_INJECTIONS = true;

    try {
      _ember['default'].run(function () {
        var zoo = store.createRecord('zoo', { name: 'The World' });
        var animal = store.createFragment('elephant', { name: 'Whitey' });

        zoo.get('animals').pushObject(animal);

        assert.equal(zoo.get('animals.firstObject.name'), animal.get('name'), 'The type check succeeded');
      });
    } finally {
      _ember['default'].MODEL_FACTORY_INJECTIONS = injectionValue;
    }
  });
});
define('dummy/tests/unit/polymorphic_test.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - unit');
  QUnit.test('unit/polymorphic_test.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/polymorphic_test.js should pass jshint.');
  });
});
define('dummy/tests/unit/serialize_test', ['exports', 'ember', 'qunit', 'dummy/tests/helpers/module-for-acceptance', 'ember-data/serializers/json', 'dummy/models/person', 'ember-data-model-fragments'], function (exports, _ember, _qunit, _dummyTestsHelpersModuleForAcceptance, _emberDataSerializersJson, _dummyModelsPerson, _emberDataModelFragments) {
  var store, application;

  (0, _dummyTestsHelpersModuleForAcceptance['default'])("unit - Serialization", {
    beforeEach: function beforeEach() {
      application = this.application;
      store = application.__container__.lookup('service:store');

      //expectNoDeprecation();

      // TODO: this is necessary to set `typeKey` and prevent `store#serializerFor` from blowing up
      store.modelFor('person');
    },

    afterEach: function afterEach() {
      application = null;
      store = null;
    }
  });

  (0, _qunit.test)("fragment properties are snapshotted as normal attributes on the owner record snapshot", function (assert) {
    var person = {
      name: {
        first: "Catelyn",
        last: "Stark"
      },
      houses: [{
        name: "Tully",
        region: "Riverlands",
        exiled: true
      }, {
        name: "Stark",
        region: "North",
        exiled: true
      }],
      children: ['Robb', 'Sansa', 'Arya', 'Brandon', 'Rickon']
    };

    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: person
        }
      });

      application.register('serializer:person', _emberDataSerializersJson['default'].extend({
        serialize: function serialize(snapshot) {
          var name = snapshot.attr('name');
          assert.ok(name instanceof DS.Snapshot, "fragment snapshot attribute is a snapshot");
          assert.equal(name.attr('first'), person.name.first, "fragment attributes are snapshoted correctly");

          var houses = snapshot.attr('houses');
          assert.ok(Array.isArray(houses), "fragment array attribute is an array");
          assert.ok(houses[0] instanceof DS.Snapshot, "fragment array attribute is an array of snapshots");
          assert.equal(houses[0].attr('name'), person.houses[0].name, "fragment array attributes are snapshotted correctly");

          var children = snapshot.attr('children');
          assert.ok(Array.isArray(children), "array attribute is an array");
          assert.deepEqual(children, person.children, "array attribute is snapshotted correctly");
        }
      }));

      return store.find('person', 1).then(function (person) {
        person.serialize();
      });
    });
  });

  (0, _qunit.test)("fragment properties are serialized as normal attributes using their own serializers", function (assert) {
    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: "Aerys",
              last: "Targaryen"
            }
          }
        }
      });

      application.register('serializer:name', _emberDataSerializersJson['default'].extend({
        serialize: function serialize() {
          return 'Mad King';
        }
      }));

      return store.find('person', 1).then(function (person) {
        var serialized = person.serialize();

        assert.equal(serialized.name, 'Mad King', "serialization uses result from `fragment#serialize`");
      });
    });
  });

  (0, _qunit.test)("serializing a fragment array creates a new array with contents the result of serializing each fragment", function (assert) {
    var names = [{
      first: "Rhaegar",
      last: "Targaryen"
    }, {
      first: "Viserys",
      last: "Targaryen"
    }, {
      first: "Daenerys",
      last: "Targaryen"
    }];

    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            names: names
          }
        }
      });

      application.register('serializer:name', _emberDataSerializersJson['default']);

      return store.find('person', 1).then(function (person) {
        var serialized = person.serialize();

        assert.deepEqual(serialized.names, names, "serializing returns array of each fragment serialized");
      });
    });
  });

  (0, _qunit.test)("normalizing data can handle `null` fragment values", function (assert) {
    var NullDefaultPerson = _dummyModelsPerson['default'].extend({
      houses: _emberDataModelFragments['default'].fragmentArray('house', { defaultValue: null }),
      children: _emberDataModelFragments['default'].array({ defaultValue: null })
    });

    application.register('model:nullDefaultPerson', NullDefaultPerson);

    var normalized = store.normalize('nullDefaultPerson', {
      name: null,
      houses: null,
      children: null
    });

    var attributes = normalized.data.attributes;

    assert.strictEqual(attributes.name, null, "fragment property values can be null");
    assert.strictEqual(attributes.houses, null, "fragment array property values can be null");
    assert.strictEqual(attributes.children, null, "`array property values can be null");
  });

  (0, _qunit.test)("normalizing data can handle `null` fragment values", function (assert) {
    var NullDefaultPerson = _dummyModelsPerson['default'].extend({
      houses: _emberDataModelFragments['default'].fragmentArray('house', { defaultValue: null }),
      children: _emberDataModelFragments['default'].array({ defaultValue: null })
    });

    application.register('model:nullDefaultPerson', NullDefaultPerson);

    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'NullDefaultPerson',
          id: 1,
          attributes: {
            name: null,
            houses: null,
            children: null
          }
        }
      });

      return store.find('nullDefaultPerson', 1).then(function (person) {
        var serialized = person.serialize();

        assert.strictEqual(serialized.name, null, "fragment property values can be null");
        assert.strictEqual(serialized.houses, null, "fragment array property values can be null");
        assert.strictEqual(serialized.children, null, "`array property values can be null");
      });
    });
  });

  (0, _qunit.test)("array properties use the specified transform to normalize data", function (assert) {
    var values = [1, 0, true, false, 'true', ''];

    var normalized = store.normalize('person', {
      strings: values,
      numbers: values,
      booleans: values
    });

    var attributes = normalized.data.attributes;

    assert.ok(values.every(function (value, index) {
      return attributes.strings[index] === String(value) && attributes.numbers[index] === (_ember['default'].isEmpty(value) || isNaN(Number(value)) ? null : Number(value)) && attributes.booleans[index] === Boolean(value);
    }), "fragment property values are normalized");
  });

  (0, _qunit.test)("array properties use the specified transform to serialize data", function (assert) {
    var values = [1, 0, true, false, 'true', ''];

    _ember['default'].run(function () {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            strings: values,
            numbers: values,
            booleans: values
          }
        }
      });

      return store.find('person', 1).then(function (person) {
        var serialized = person.serialize();

        assert.ok(values.every(function (value, index) {
          return serialized.strings[index] === String(value) && serialized.numbers[index] === (_ember['default'].isEmpty(value) || isNaN(Number(value)) ? null : Number(value)) && serialized.booleans[index] === Boolean(value);
        }), "fragment property values are normalized");
      });
    });
  });
});
define('dummy/tests/unit/serialize_test.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - unit');
  QUnit.test('unit/serialize_test.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/serialize_test.js should pass jshint.');
  });
});
define('dummy/tests/unit/store_test', ['exports', 'ember', 'qunit', 'dummy/tests/helpers/module-for-acceptance', 'dummy/models/name', 'ember-data/serializers/json-api', 'ember-data/serializers/json'], function (exports, _ember, _qunit, _dummyTestsHelpersModuleForAcceptance, _dummyModelsName, _emberDataSerializersJsonApi, _emberDataSerializersJson) {
  var store, application;

  (0, _dummyTestsHelpersModuleForAcceptance['default'])("unit - `DS.Store`", {
    beforeEach: function beforeEach() {
      application = this.application;
      store = application.__container__.lookup('service:store');

      //expectNoDeprecation();
    },

    afterEach: function afterEach() {
      store = null;
      application = null;
    }
  });

  (0, _qunit.test)("a fragment can be created that starts in a dirty state", function (assert) {
    _ember['default'].run(function () {
      var address = store.createFragment('name');

      assert.ok(address instanceof _dummyModelsName['default'], "fragment is correct type");
      assert.ok(address.get('hasDirtyAttributes'), "fragment starts in dirty state");
    });
  });

  (0, _qunit.test)("attempting to create a fragment type that does not inherit from `MF.Fragment` throws an error", function (assert) {
    _ember['default'].run(function () {
      assert.throws(function () {
        store.createFragment('person');
      }, "an error is thrown when given a bad type");
    });
  });

  (0, _qunit.test)("the default fragment serializer does not use the application serializer", function (assert) {
    var Serializer = _emberDataSerializersJsonApi['default'].extend();
    application.register('serializer:application', Serializer);

    assert.ok(!(store.serializerFor('name') instanceof Serializer), "fragment serializer fallback is not `JSONAPISerializer`");
    assert.ok(store.serializerFor('name') instanceof _emberDataSerializersJson['default'], "fragment serializer fallback is correct");
  });

  (0, _qunit.test)("the default fragment serializer does not use the adapter's `defaultSerializer`", function (assert) {
    store.set('defaultAdapter.defaultSerializer', '-json-api');

    assert.ok(!(store.serializerFor('name') instanceof _emberDataSerializersJsonApi['default']), "fragment serializer fallback is not `JSONAPISerializer`");
    assert.ok(store.serializerFor('name') instanceof _emberDataSerializersJson['default'], "fragment serializer fallback is correct");
  });

  (0, _qunit.test)("the default fragment serializer is `serializer:-fragment` if registered", function (assert) {
    var Serializer = _emberDataSerializersJson['default'].extend();
    application.register('serializer:-fragment', Serializer);

    assert.ok(store.serializerFor('name') instanceof Serializer, "fragment serializer fallback is correct");
  });

  (0, _qunit.test)("the application serializer can be looked up", function (assert) {
    assert.ok(store.serializerFor('application') instanceof _emberDataSerializersJson['default'], "application serializer can still be looked up");
  });

  (0, _qunit.test)("the default serializer can be looked up", function (assert) {
    assert.ok(store.serializerFor('-default') instanceof _emberDataSerializersJson['default'], "default serializer can still be looked up");
  });
});
define('dummy/tests/unit/store_test.jshint', ['exports'], function (exports) {
  'use strict';

  QUnit.module('JSHint - unit');
  QUnit.test('unit/store_test.js should pass jshint', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/store_test.js should pass jshint.');
  });
});
/* jshint ignore:start */

require('dummy/tests/test-helper');
EmberENV.TESTS_FILE_LOADED = true;

/* jshint ignore:end */
//# sourceMappingURL=tests.map