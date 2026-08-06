import {
  installWarpDriveEmber,
  getBuiltinTransformModules,
} from './helpers/ember-data-compat.ts';

installWarpDriveEmber();

import '../demo-app/deprecation-workflow.ts';

import EmberApp from 'ember-strict-application-resolver';
import EmberRouter from '@ember/routing/router';
import PageTitleService from 'ember-page-title/services/page-title';
import FragmentTransform from '#src/transforms/fragment.ts';
import FragmentArrayTransform from '#src/transforms/fragment-array.ts';
import ArrayTransform from '#src/transforms/array.ts';
import * as QUnit from 'qunit';
import { setApplication } from '@ember/test-helpers';
import { setup } from 'qunit-dom';
import { start as qunitStart, setupEmberOnerrorValidation } from 'ember-qunit';

import { setup as setupCustomAssertions } from './helpers/assertion.ts';
import normalizeGlob from '../demo-app/utils/normalize-glob.ts';

class Router extends EmberRouter {
  location = 'none';
  rootURL = '/';
}

Router.map(function () {});

class TestApp extends EmberApp {
  modules = {
    './router': Router,
    './services/page-title': PageTitleService,
    ...getBuiltinTransformModules(),
    './transforms/fragment': FragmentTransform,
    './transforms/fragment-array': FragmentArrayTransform,
    './transforms/array': ArrayTransform,
    ...normalizeGlob(
      import.meta.glob('../demo-app/adapters/**/*', { eager: true }),
      '../demo-app/',
    ),
    ...normalizeGlob(
      import.meta.glob('../demo-app/serializers/**/*', { eager: true }),
      '../demo-app/',
    ),
    ...normalizeGlob(
      import.meta.glob('../demo-app/services/**/*', { eager: true }),
      '../demo-app/',
    ),
    ...normalizeGlob(
      import.meta.glob('../demo-app/models/**/*', { eager: true }),
      '../demo-app/',
    ),
    ...normalizeGlob(
      import.meta.glob('../demo-app/templates/**/*', { eager: true }),
      '../demo-app/',
    ),
  };
}

export function start() {
  setApplication(
    TestApp.create({
      autoboot: false,
      rootElement: '#ember-testing',
    }),
  );
  setup(QUnit.assert);
  setupCustomAssertions(QUnit.assert);
  setupEmberOnerrorValidation();
  qunitStart();
}
