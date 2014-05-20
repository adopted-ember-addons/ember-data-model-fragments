var grunt = require('grunt');

module.exports = {
  browser: {
    src: [ 'vendor/loader.js', 'tmp/transpiled/**/*.js' ],
    dest: 'tmp/ember-data.model-fragments.js',
    options: {
      banner: grunt.file.read('license.js') + '(function() {\n',
      footer: '\nrequireModule("main")["default"];\n}());',
    },
  },
};
