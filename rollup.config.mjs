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

    addon.keepAssets(['**/*.css']),

    addon.clean(),
  ],
};
