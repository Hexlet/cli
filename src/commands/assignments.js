// @ts-check

const _ = require('lodash');

const obj = {
  command: 'assignments <command>',
  description: 'Manage assignments repository (init, migrate-from-program)',
  builder: (yargs) => yargs.commandDir('assignments'),
  handler: _.noop(),
};

module.exports = obj;
