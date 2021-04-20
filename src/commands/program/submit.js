// @ts-check

const fse = require('fs-extra');
const fs = require('fs');
const http = require('isomorphic-git/http/node');
const chalk = require('chalk');
const path = require('path');
const debug = require('debug');
const git = require('isomorphic-git');

const log = debug('hexlet');

const initSettings = require('../../settings.js');
const { readHexletConfig } = require('../../utils.js');

const handler = async ({
  program, exercise,
}, customSettings = {}) => {
  const {
    author, generateHexletProgramPath, hexletConfigPath, branch,
  } = initSettings(customSettings);

  const { gitlabToken, programs } = await readHexletConfig(hexletConfigPath);

  const programPath = generateHexletProgramPath(program);

  const exercisePath = path.join(programPath, 'exercises', exercise);
  log(exercisePath);
  if (!await fse.pathExists(exercisePath)) {
    throw new Error(`Exercise with name "${exercise}" does not exists. Check the name and try again or try to download it`);
  }

  await git.pull({
    fs,
    http,
    dir: programPath,
    ref: branch,
    singleBranch: true,
    onAuth: () => ({ username: 'oauth2', password: gitlabToken }),
    author,
  });

  const current = { exercise };
  const currentExerciseConfigPath = path.join(programPath, '.current.json');
  await fse.writeJson(currentExerciseConfigPath, current);

  const statuses = await git.statusMatrix({ fs, dir: programPath });
  const statusDifferentFromHead = 2;
  const statusIdenticalToHead = 1;
  const changedStatuses = statuses.filter(
    ([, , workdirStatus]) => workdirStatus !== statusIdenticalToHead,
  );
  const promises = changedStatuses.map(([filepath, , workdirStatus]) => {
    if (statusDifferentFromHead === workdirStatus) {
      return git.add({ fs, dir: programPath, filepath });
    }
    return git.remove({ fs, dir: programPath, filepath });
  });
  await Promise.all(promises);

  if (promises.length > 0) {
    await git.commit({
      fs,
      dir: programPath,
      message: '@hexlet/cli: submit',
      author,
    });

    await git.push({
      fs,
      http,
      dir: programPath,
      // url: repoUrl,
      onAuth: () => ({ username: 'oauth2', password: gitlabToken }),
      remote: 'origin',
      ref: branch,
    });
    console.log(chalk.green(`Exercise has been submitted! Open ${programs[program].gitlabUrl}`));
  } else {
    console.log(chalk.grey('Nothing changed. Skip commiting'));
  }
};

const obj = {
  command: 'submit <program> <exercise>',
  description: 'Submit exercises',
  builder: () => {},
  handler,
};

module.exports = obj;
