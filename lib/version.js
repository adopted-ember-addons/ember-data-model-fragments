'use strict';

const calculateVersion = require('./calculate-version');
const createFile = require('broccoli-file-creator');

module.exports = function() {
  return createFile('version.js', `export default "${calculateVersion()}";`);
};
