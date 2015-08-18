/* jshint node:true */

var BuildTask = require('ember-cli/lib/tasks/build');
var RSVP = require('rsvp');
var publisher = require('publish');

// Create promise friendly versions of the methods we want to use
var start = RSVP.denodeify(publisher.start);
var publish = RSVP.denodeify(publisher.publish);

module.exports = {
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
  },

  // Publish the new release to NPM after a successful push
  afterPush: function() {
    return start().then(function() {
      return publish();
    });
  }
};
