module.exports = {
  amd: {
    type: 'amd',
    files: [
      {
        expand: true,
        cwd: 'packages/model-fragments/lib/',
        src: [ '**/*.js', ],
        dest: 'tmp/transpiled/'
      },
    ],
  },
};
