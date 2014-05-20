var grunt = require('grunt');

module.exports = {
  options: {
    report: 'min',
    wrap: true,
    banner: grunt.file.read('license.js')
  },
  dist: {
    files: [
      {
        src: 'dist/ember-data.model-fragments.prod.js',
        dest: 'dist/ember-data.model-fragments.min.js',
      },
    ],
  },
};
