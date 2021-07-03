// @ts-check

const _ = require('lodash');
const semver = require('semver');

if (semver.lt(process.versions.node, '14.0.0')) {
  throw new Error('You need at least Node v14 to work with @hexlet/cli');
}

const obj = {
  command: 'program <command>',
  description: 'Manage programs',
  builder: (yargs) => yargs.commandDir('program'),
  handler: _.noop(),
};

module.exports = obj;
