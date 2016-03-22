/* jshint node:true */

var BuildTask = require('ember-cli/lib/tasks/build');

module.exports = {
  publish: true,

  // Build the project in the production environment, outputting to dist/
  beforeCommit: function(project) {
    var task = new BuildTask({
      project: project,
      ui: project.ui,
      analytics: project.cli.analytics
    });

    return task.run({
      environment: 'production',
      outputPath: 'dist/'
    });
  }
};
