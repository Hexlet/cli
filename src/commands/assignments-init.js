// @ts-check

const path = require('path');
const os = require('os');

const handler = require('../handlers/assignments/init.js');

module.exports = {
  command: 'assignments init',
  description: 'Init assignments repository',
  builder: (yargs) => {
    yargs.option('github-token', {
      description: 'Github Token',
      required: true,
      type: 'string',
    });
    yargs.option('hexlet-token', {
      description: 'Hexlet token',
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
