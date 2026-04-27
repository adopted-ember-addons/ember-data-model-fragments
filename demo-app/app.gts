// @ts-nocheck -- incremental TS conversion; types will be tightened in follow-up PRs.
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

class Router extends EmberRouter {
  location = 'history';
  rootURL = '/';
}

// Map import.meta.glob keys (e.g. './models/lion.ts') to the strict-resolver
// expected key shape (e.g. './models/lion'). The resolver matches on
// `./[type]/[name]` patterns.
function normalizeGlob(glob) {
  return Object.fromEntries(
    Object.entries(glob).map(([key, value]) => [
      key.replace(/\.(js|gjs|ts|gts)$/, ''),
      value,
    ]),
  );
}

export class App extends EmberApp {
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
    ...normalizeGlob(import.meta.glob('./adapters/**/*', { eager: true })),
    ...normalizeGlob(import.meta.glob('./serializers/**/*', { eager: true })),
    ...normalizeGlob(import.meta.glob('./services/**/*', { eager: true })),
    ...normalizeGlob(import.meta.glob('./models/**/*', { eager: true })),
    ...normalizeGlob(import.meta.glob('./templates/**/*', { eager: true })),
  };
}

Router.map(function () {});
