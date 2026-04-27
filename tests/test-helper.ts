// @ts-nocheck -- incremental TS conversion; types will be tightened in follow-up PRs.
import '@warp-drive/ember/install';
import '../demo-app/deprecation-workflow.js';

import EmberApp from 'ember-strict-application-resolver';
import EmberRouter from '@ember/routing/router';
import PageTitleService from 'ember-page-title/services/page-title';
import {
  BooleanTransform,
  DateTransform,
  NumberTransform,
  StringTransform,
} from '@ember-data/serializer/transform';
import FragmentTransform from '#src/transforms/fragment.ts';
import FragmentArrayTransform from '#src/transforms/fragment-array.ts';
import ArrayTransform from '#src/transforms/array.ts';
import * as QUnit from 'qunit';
import { setApplication } from '@ember/test-helpers';
import { setup } from 'qunit-dom';
import { start as qunitStart, setupEmberOnerrorValidation } from 'ember-qunit';

import { setup as setupCustomAssertions } from './helpers/assertion.ts';

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
