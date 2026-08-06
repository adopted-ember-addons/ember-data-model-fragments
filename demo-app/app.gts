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
import normalizeGlob from './utils/normalize-glob.ts';

class Router extends EmberRouter {
  location = 'history';
  rootURL = '/';
}

export class App extends EmberApp {
  /**
   * Any services or anything from the addon that needs to be in the app-tree registry
   * will need to be manually specified here.
   *
   * Techniques to avoid needing this:
   * - private services
   * - require the consuming app import and configure themselves
   *   (which is what we're emulating here)
   */
  modules = {
    './router': Router,
    './services/page-title': PageTitleService,
    /**
     * NOTE: this glob will import everything matching the glob,
     *     and includes non-services in the services directory.
     */
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
    /**
     * These imports are not magic, but we do require that all entries in the
     * modules object match a ./[type]/[name] pattern.
     *
     * See: https://rfcs.emberjs.com/id/1132-default-strict-resolver
     */
  };
}

Router.map(function () {});
