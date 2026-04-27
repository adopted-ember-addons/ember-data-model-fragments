'use strict';

module.exports = {
  plugins: [
    // Decorators must come before class properties.
    [
      '@babel/plugin-proposal-decorators',
      { decoratorsBeforeExport: true },
    ],
  ],
};
