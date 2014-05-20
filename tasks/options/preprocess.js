module.exports = {
  version : {
    options: {
      inline: true,
      context : {
        version: '<%= package.version %>',
      },
    },
    src: [ 'tmp/ember-data.model-fragments.js' ],
  },
};
