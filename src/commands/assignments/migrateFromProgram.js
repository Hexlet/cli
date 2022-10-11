// @ts-check

const handler = require('../../handlers/assignments/migrateFromProgram.js');

module.exports = {
  command: 'migrate-from-program <program>',
  description: 'Migrate assignments from program',
  builder: (yargs) => {
    yargs.option('skip-import-gitlab', {
      description: 'Skip import repository to personal Gitlab accaunt',
      demandOption: false,
      type: 'boolean',
      default: false,
    });
    yargs.choices(
      'program',
      ['java', 'rails', 'devops-for-programmers', 'frontend-testing-react'],
    );
  },
  handler,
};
