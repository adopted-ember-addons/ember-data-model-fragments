var grunt = require('grunt');

module.exports = {
  options: {
    report: 'min',
    wrap: true,
    banner: '/*\n' + grunt.file.read('LICENSE') + '*/\n',
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
