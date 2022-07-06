// @ts-check

const handler = require('../../handlers/assignment/download.js');

const obj = {
  command: 'refresh <lesson-url>',
  description: 'Download latest version of the assignment',
  builder: () => {},
  handler: (args, customSettings) => handler({ ...args, refresh: true }, customSettings),
};

module.exports = obj;
