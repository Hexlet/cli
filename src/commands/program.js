const _ = require('lodash');

const obj = {
  command: 'program <command>',
  description: 'Manage programs',
  builder: (yargs) => yargs.commandDir('program'),
  handler: _.noop(),
};

module.exports = obj;
