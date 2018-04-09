'use strict';

const path = require('path');
const fs = require('fs');
const gitRepoInfo = require('git-repo-info');
const npmGitInfo = require('npm-git-info');

module.exports = function() {
  let gitPath = path.join(__dirname, '..', '.git');
  let packageJson = require('../package.json');
  let packageVersion = packageJson.version;
  let suffix = '';

  if (fs.existsSync(gitPath)) {
    let info = gitRepoInfo(gitPath);
    if (info.tag) {
      return info.tag.replace(/^v/, '');
    }

    suffix = `+${info.sha.slice(0, 10)}`;
  } else {
    let info = npmGitInfo(packageJson);
    if (info.isInstalledAsNpmPackage() && !info.hasVersionInRef()) {
      suffix = `+${info.abbreviatedSha}`;
    }
  }

  return packageVersion + suffix;
};
