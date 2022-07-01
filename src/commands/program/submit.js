// @ts-check

const chalk = require('chalk');
const debug = require('debug');
const _ = require('lodash');

const log = debug('hexlet');

const { initSettings, readHexletConfig } = require('../../config.js');
const { getChangedExercises } = require('../../utils/program.js');
const git = require('../../utils/git.js');

const handler = async ({ program }, customSettings = {}) => {
  const {
    author, generateHexletProgramPath, hexletConfigPath, branch,
  } = initSettings(customSettings);

  const { gitlabToken, programs, hexletDir } = await readHexletConfig(hexletConfigPath);

  const programPath = generateHexletProgramPath(hexletDir, program);
  log(programPath);

  await git.pullMerge({
    dir: programPath,
    ref: branch,
    token: gitlabToken,
    author,
  });

  await git.addAll({ dir: programPath });

  const workDirChanged = await git.isWorkDirChanged({ dir: programPath });

  if (workDirChanged) {
    await git.commit({
      dir: programPath,
      message: '@hexlet/cli: submit',
      author,
    });
  } else {
    console.log(chalk.grey('Nothing changed. Skip commiting'));
  }

  const localLog = await git.log({ dir: programPath, ref: branch });
  const remoteLog = await git.log({ dir: programPath, ref: `origin/${branch}` });
  const localHistoryAhead = !_.isEqual(localLog, remoteLog);

  if (localHistoryAhead) {
    const uniqueExerciseNames = await getChangedExercises({
      dir: programPath,
      ref: `origin/${branch}`,
    });

    await git.push({
      dir: programPath,
      ref: branch,
      token: gitlabToken,
    });

    console.log(chalk.yellow('Changed exercises:'));
    console.log(uniqueExerciseNames.join('\n'));
    console.log();
    console.log(chalk.green(`Exercises have been submitted! Open ${programs[program].gitlabUrl}`));
  } else {
    console.log(chalk.grey('Nothing to push. Skip pushing'));
  }
};

const obj = {
  command: 'submit <program>',
  description: 'Submit exercises',
  builder: () => {},
  handler,
};

module.exports = obj;
