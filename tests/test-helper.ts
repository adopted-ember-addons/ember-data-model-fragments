import EmberApp from '@ember/application';
import Resolver from 'ember-resolver';
import EmberRouter from '@ember/routing/router';
import * as FragmentInitializer from '#src/instance-initializers/fragment-extensions.ts';
import loadInitializers from 'ember-load-initializers';
import * as QUnit from 'qunit';
import { setApplication } from '@ember/test-helpers';
import { setup } from 'qunit-dom';
import { start as qunitStart, setupEmberOnerrorValidation } from 'ember-qunit';
import ApplicationAdapter from './dummy/adapters/application';
import { Store } from './dummy/services/app-store';
import ApplicationSerializer from './dummy/serializers/application';

class Router extends EmberRouter {
  location = 'none';
  rootURL = '/';
}
Router.map(function () {});

const registry = {
  'test-app/adapters/application': ApplicationAdapter,
  'test-app/router': { default: Router },
  'test-app/instance-initializers/fragment-extensions': FragmentInitializer,
  'test-app/serializers/application': { default: ApplicationSerializer },
  'test-app/services/store': { default: Store },
  // add any custom services here
};

class TestApp extends EmberApp {
  modulePrefix = 'test-app';
  Resolver = Resolver.withModules(registry);
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
loadInitializers(TestApp, 'test-app', registry as any);

export function start() {
  setApplication(
    TestApp.create({
      autoboot: false,
      rootElement: '#ember-testing',
    }),
  );
  setup(QUnit.assert);
  setupEmberOnerrorValidation();
  qunitStart();
}
