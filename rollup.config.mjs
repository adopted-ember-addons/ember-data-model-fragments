import { babel } from '@rollup/plugin-babel';
import { Addon } from '@embroider/addon-dev/rollup';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

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
