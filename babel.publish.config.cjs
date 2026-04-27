'use strict';

// Babel config used by rollup when building the addon for publishing.
// Keep this minimal: do not transform ES modules (rollup needs them) and
// do not apply presets that would compile away modern syntax that
// consumers' build tools can handle.
module.exports = {
  plugins: [
    [
      'babel-plugin-ember-template-compilation',
      {
        targetFormat: 'hbs',
        transforms: [],
      },
    ],
    [
      'module:decorator-transforms',
      {
        runtime: { import: 'decorator-transforms/runtime-esm' },
      },
    ],
  ],

  generatorOpts: {
    compact: false,
  },
};
