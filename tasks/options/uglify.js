module.exports = {
  options: {
    report: 'min',
    wrap: true,
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
