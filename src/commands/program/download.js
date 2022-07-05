// @ts-check

const handler = require('../../handlers/program/download.js');

module.exports = {
  command: 'download <program> <exercise>',
  description: 'Download exercises',
  builder: () => {},
  handler,
};
