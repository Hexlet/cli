// @ts-check

const handler = require('../../handlers/assignments/migrateFromProgram.js');

module.exports = {
  command: 'migrate-from-program <program>',
  description: 'Migrate assignments from program',
  builder: (yargs) => {
    yargs.choices(
      'program',
      ['java'],
      // ['java', 'rails', 'devops-for-programmers', 'frontend-testing-react'],
    );
  },
  handler,
};
