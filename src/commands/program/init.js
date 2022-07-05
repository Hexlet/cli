// @ts-check

const path = require('path');
const os = require('os');

const handler = require('../../handlers/program/init.js');

module.exports = {
  command: 'init',
  description: 'Init repository',
  builder: (yargs) => {
    yargs.option('gitlab-token', {
      description: 'Gitlab Token',
      required: true,
      type: 'string',
    });
    // TODO switch to hexlet group id after integration with hexlet
    yargs.option('gitlab-group-id', {
      description: 'Gitlab Group Id',
      required: true,
      type: 'string',
    });
    yargs.option('hexlet-user-id', {
      description: 'Hexlet User Id',
      required: true,
      type: 'string',
    });
    yargs.option('hexlet-dir', {
      description: 'Path to Hexlet directory',
      required: false,
      type: 'string',
      default: path.join(os.homedir(), 'Hexlet'),
    });
    yargs.coerce('hexlet-dir', (opt) => path.resolve(process.cwd(), opt));
  },
  handler,
};
