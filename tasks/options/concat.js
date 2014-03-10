module.exports = {
  browser: {
    src: [ 'vendor/loader.js', 'tmp/**/*.js' ],
    dest: 'dist/ember-data.model-fragments.js',
    options: {
      banner: '(function() {\n',
      footer: '\nrequireModule("main")["default"];\n}());',
    },
  },
};
