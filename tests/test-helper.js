import {
  macroCondition,
  dependencySatisfies,
  importSync,
} from '@embroider/macros';

// `@warp-drive/ember/install` reads `getOwnConfig().deprecations` from
// `@warp-drive/build-config`, which only ships a macro-resolvable config on
// ember-data >= 4.13. Guard the import so we still support ember-data 4.12.
if (macroCondition(dependencySatisfies('ember-data', '>=4.13.0-alpha.0'))) {
  importSync('@warp-drive/ember/install');
}
import '../demo-app/deprecation-workflow.js';

import EmberApp from 'ember-strict-application-resolver';
import EmberRouter from '@ember/routing/router';
import PageTitleService from 'ember-page-title/services/page-title';
import FragmentTransform from '#src/transforms/fragment.js';
import FragmentArrayTransform from '#src/transforms/fragment-array.js';
import ArrayTransform from '#src/transforms/array.js';
import * as QUnit from 'qunit';
import { setApplication } from '@ember/test-helpers';
import { setup } from 'qunit-dom';
import { start as qunitStart, setupEmberOnerrorValidation } from 'ember-qunit';

import { setup as setupCustomAssertions } from './helpers/assertion.js';

class Router extends EmberRouter {
  location = 'none';
  rootURL = '/';
}

// ember-data 5.x exposes the built-in transforms as named exports from
// `@ember-data/serializer/transform`. On 4.x they aren't shipped at that
// public path; the addon re-exports them from `@ember-data/serializer/-private`
// via `app/transforms/*` files, so we read them from there. Either way the
// strict resolver needs them registered explicitly.
let builtinTransformModules = {};
if (macroCondition(dependencySatisfies('ember-data', '>=5.0.0'))) {
  const { BooleanTransform, DateTransform, NumberTransform, StringTransform } =
    importSync('@ember-data/serializer/transform');
  builtinTransformModules = {
    './transforms/boolean': BooleanTransform,
    './transforms/date': DateTransform,
    './transforms/number': NumberTransform,
    './transforms/string': StringTransform,
  };
} else {
  const { BooleanTransform, DateTransform, NumberTransform, StringTransform } =
    importSync('@ember-data/serializer/-private');
  builtinTransformModules = {
    './transforms/boolean': BooleanTransform,
    './transforms/date': DateTransform,
    './transforms/number': NumberTransform,
    './transforms/string': StringTransform,
  };
}

// Map import.meta.glob keys (e.g. '../demo-app/models/lion.js') to the
// strict-resolver expected key shape (e.g. './models/lion').
function normalizeGlob(glob, prefix) {
  return Object.fromEntries(
    Object.entries(glob).map(([key, value]) => [
      key.replace(prefix, './').replace(/\.(js|gjs|ts|gts)$/, ''),
      value,
    ]),
  );
}

class TestApp extends EmberApp {
  modules = {
    './router': Router,
    './services/page-title': PageTitleService,
    ...builtinTransformModules,
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

Router.map(function () {});

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
