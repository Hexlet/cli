// @ts-check

const handler = require('../../handlers/assignment/download.js');

const obj = {
  command: 'download <lesson_url>',
  description: 'Download assignment',
  builder: () => {},
  handler,
};

module.exports = obj;
