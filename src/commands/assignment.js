// @ts-check

const _ = require('lodash');

const obj = {
  command: 'assignment <command>',
  description: 'Manage assignments (download, refresh, submit)',
  builder: (yargs) => yargs.commandDir('assignment'),
  handler: _.noop(),
};

module.exports = obj;
