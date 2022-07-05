// @ts-check

const handler = require('../../handlers/program/submit.js');

module.exports = {
  command: 'submit <program>',
  description: 'Submit exercises',
  builder: () => {},
  handler,
};
