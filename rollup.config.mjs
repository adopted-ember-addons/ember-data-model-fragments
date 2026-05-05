import { babel } from '@rollup/plugin-babel';
import replace from '@rollup/plugin-replace';
import { Addon } from '@embroider/addon-dev/rollup';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const calculateVersion = require('./lib/calculate-version.cjs');

const addon = new Addon({
  srcDir: 'src',
  destDir: 'dist',
});

const rootDirectory = dirname(fileURLToPath(import.meta.url));
const babelConfig = resolve(rootDirectory, './babel.publish.config.cjs');

export default {
  output: addon.output(),

  plugins: [
    // Public modules importable by consumers. Mirrors the v1 addon's
    // historical surface (addon/**/*.js).
    addon.publicEntrypoints([
      'index.js',
      'fragment.js',
      'ext.js',
      'serializer.js',
      'schema-service.js',
      'store.js',
      'array/**/*.js',
      'attributes/**/*.js',
      'cache/**/*.js',
      'serializers/**/*.js',
      'transforms/**/*.js',
      'util/**/*.js',
    ]),

    // Re-exported into the consuming app's `app/` namespace. This preserves
    // ember-data's transform discovery via container lookup.
    addon.appReexports(['transforms/**/*.js']),

    addon.dependencies(),

    // Replace the version placeholder in src/version.js with the actual
    // computed version (package.json version + optional git sha).
    replace({
      preventAssignment: true,
      values: {
        __EMBER_DATA_MODEL_FRAGMENTS_VERSION__: calculateVersion(),
      },
    }),

    babel({
      extensions: ['.js', '.gjs', '.ts', '.gts'],
      babelHelpers: 'bundled',
      configFile: babelConfig,
    }),

    addon.hbs(),
    addon.gjs(),

    // NOTE: We intentionally do NOT use `addon.declarations()` to emit
    // .d.ts files from src/. The hand-rolled declarations under
    // `declarations/` expose a curated public API (generics over
    // FragmentRegistry / TransformRegistry, FragmentArray<T>,
    // FragmentOptions<K>, Store.createFragment<K>, etc.) that is strictly
    // better than what tsc would emit today: the source is heavily
    // annotated with `: any` to satisfy ember-tsc against ember-data 5.8
    // internals, so generated declarations would (a) drop all generics,
    // (b) leak `@ember/-internals/*` deep imports, (c) expose internal
    // helpers, and (d) emit `.ts` import suffixes that break consumers.
    //
    // Re-enable this once src/ is properly typed (no `: any`) and the
    // generated output matches or exceeds the hand-rolled surface:
    //
    //   import { resolve } from 'node:path';
    //   const tsConfig = resolve(rootDirectory, './tsconfig.publish.json');
    //   addon.declarations(
    //     'declarations',
    //     `pnpm ember-tsc --declaration --project ${tsConfig}`,
    //   ),

    addon.keepAssets(['**/*.css']),

    addon.clean(),
  ],
};
