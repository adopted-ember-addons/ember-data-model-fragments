module.exports = function(grunt) {
  // Load all grunt tasks and options from `/tasks/options` dir
  require('load-grunt-config')(grunt, {
    configPath: require('path').join(process.cwd(), 'tasks/options')
  });

  grunt.registerTask('build', "Build to the 'tmp/' directory and lint source", [
    'clean',
    'transpile:amd',
    'concat:browser',
    'preprocess:version',
    'jshint:src',
  ]);

  grunt.registerTask('dist', "Minify and defeature-ify build", [
    'build',
    'copy:debug',
    'emberDefeatureify:stripDebug',
    'uglify:dist',
  ]);
};
