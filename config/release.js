/* jshint node:true */

var BuildTask = require('ember-cli/lib/tasks/build');

module.exports = {
  publish: true,

  beforeCommit: function(project) {
    // Build the project in the production environment, outputting to dist/
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
