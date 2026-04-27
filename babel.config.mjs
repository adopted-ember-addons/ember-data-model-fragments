/**
 * This babel.config is not used for publishing.
 * It's only for the local editing experience (and for the demo app + test build).
 */
import { buildMacros } from '@embroider/macros/babel';
import {
  babelCompatSupport,
  templateCompatSupport,
} from '@embroider/compat/babel';
import { setConfig } from '@warp-drive/build-config';
import { macros as warpDriveMacros } from '@warp-drive/build-config/babel-macros';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const macros = buildMacros({
  configure: (config) => {
    setConfig(config, {});
  },
});

// For scenario testing
const isCompat = Boolean(process.env.ENABLE_COMPAT_BUILD);

export default {
  plugins: [
    [
      'babel-plugin-ember-template-compilation',
      {
        transforms: [
          ...(isCompat ? templateCompatSupport() : macros.templateMacros),
        ],
      },
    ],
    [
      'module:decorator-transforms',
      {
        runtime: {
          import: require.resolve('decorator-transforms/runtime-esm'),
        },
      },
    ],
    ...warpDriveMacros(),
    ...(isCompat ? babelCompatSupport() : macros.babelMacros),
  ],

  generatorOpts: {
    compact: false,
  },
};
