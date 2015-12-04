/* jshint node:true */

var BuildTask = require('ember-cli/lib/tasks/build');
var RSVP = require('rsvp');
var publisher = require('publish');
var fs = require('fs');
var path = require('path');

// Create promise friendly versions of the methods we want to use
var start = RSVP.denodeify(publisher.start);
var publish = RSVP.denodeify(publisher.publish);
var readFile = RSVP.denodeify(fs.readFile);
var writeFile = RSVP.denodeify(fs.writeFile);

function getMinorVersion(version) {
  var match = version.match(/v(.+)\..+$/);
  return match[1];
}

function replaceInFile(rootPath, filePath, find, replace) {
  var fullPath = path.join(rootPath, filePath);
  var findRegexp = new RegExp(find, 'g');

  return readFile(fullPath, 'utf8')
    .then(function(content) {
      var replacedContent = content.replace(findRegexp, replace);
      return writeFile(fullPath, replacedContent, 'utf8');
    });
}

module.exports = {
  beforeCommit: function(project, versions) {
    var promises = [];

    // Update minor version restriction in CI
    var latest = '~' + getMinorVersion(versions.latest);
    var next = '~' + getMinorVersion(versions.next);

    if (latest !== next) {
      promises.push(replaceInFile(project.root, '.travis.yml', latest, next));
    }

    // Build the project in the production environment, outputting to dist/
    var task = new BuildTask({
      project: project,
      ui: project.ui,
      analytics: project.cli.analytics
    });

    promises.push(task.run({
      environment: 'production',
      outputPath: 'dist/'
    }));

    return RSVP.all(promises);
  },

  // Publish the new release to NPM after a successful push
  afterPush: function() {
    return start().then(function() {
      return publish({});
    });
  }
};
