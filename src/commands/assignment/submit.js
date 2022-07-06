// @ts-check

const handler = require('../../handlers/assignment/submit.js');

module.exports = {
  command: 'submit',
  description: 'Submit assignment (must be called from the assignment directory)',
  builder: () => {},
  handler,
};
