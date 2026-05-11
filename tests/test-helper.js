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
// ember-data 5.x exposes the built-in transforms as named exports from
// `@ember-data/serializer/transform`. On 4.12 those named exports don't
// exist; the legacy layout ships one default export per transform module.
// Switch the import shape at build time so both branches stay tree-shakeable.
let BooleanTransform, DateTransform, NumberTransform, StringTransform;
if (macroCondition(dependencySatisfies('ember-data', '>=5.0.0'))) {
  const transforms = importSync('@ember-data/serializer/transform');
  BooleanTransform = transforms.BooleanTransform;
  DateTransform = transforms.DateTransform;
  NumberTransform = transforms.NumberTransform;
  StringTransform = transforms.StringTransform;
} else {
  BooleanTransform = importSync(
    '@ember-data/serializer/transforms/boolean',
  ).default;
  DateTransform = importSync('@ember-data/serializer/transforms/date').default;
  NumberTransform = importSync(
    '@ember-data/serializer/transforms/number',
  ).default;
  StringTransform = importSync(
    '@ember-data/serializer/transforms/string',
  ).default;
}
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
    './transforms/string': StringTransform,
    './transforms/number': NumberTransform,
    './transforms/boolean': BooleanTransform,
    './transforms/date': DateTransform,
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
