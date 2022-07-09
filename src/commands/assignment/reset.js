// @ts-check

const handler = require('../../handlers/assignment/download.js');

const obj = {
  command: 'reset <lesson-url>',
  description: 'Download latest version of the assignment',
  builder: () => {},
  handler: (args, customSettings) => handler({ ...args, reset: true }, customSettings),
};

module.exports = obj;
