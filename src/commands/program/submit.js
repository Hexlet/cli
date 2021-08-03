// @ts-check

const fs = require('fs');
const http = require('isomorphic-git/http/node');
const chalk = require('chalk');
const debug = require('debug');
const git = require('isomorphic-git');
const _ = require('lodash');

const log = debug('hexlet');

const initSettings = require('../../settings.js');
const { readHexletConfig } = require('../../utils.js');

const handler = async ({ program }, customSettings = {}) => {
  const {
    author, generateHexletProgramPath, hexletConfigPath, branch,
  } = initSettings(customSettings);

  const { gitlabToken, programs } = await readHexletConfig(hexletConfigPath);

  const programPath = generateHexletProgramPath(program);
  log(programPath);

  const fileStatuses = await git.statusMatrix({ fs, dir: programPath });

  // NOTE: решение проблемы со стиранием stagged файлов
  const resetIndexPromises = fileStatuses
    .filter(([, , workTreeStatus, stagedStatus]) => {
      const existAndStaged = stagedStatus === 2 || stagedStatus === 3;
      const deletedAndStaged = workTreeStatus === 0 && stagedStatus === 0;
      return existAndStaged || deletedAndStaged;
    })
    .map(([filepath]) => (
      git.resetIndex({ fs, dir: programPath, filepath })
    ));
  await Promise.all(resetIndexPromises);

  try {
    // NOTE: pull стирает stagged файлы
    await git.pull({
      fs,
      http,
      dir: programPath,
      ref: branch,
      singleBranch: true,
      onAuth: () => ({ username: 'oauth2', password: gitlabToken }),
      author,
    });
  } catch (e) {
    // NOTE: внутри git.pull вызывается git.checkout без установленной опции force (это хорошо)
    // потому коммит из удалённого репозитория пулится, но в рабочей директории
    // остаются файлы с локальными изменениями (состояние рабочей директории приоритетно).
    // Решение конфиликтов (см. тесты)
    if (!(e instanceof git.Errors.CheckoutConflictError)) {
      throw e;
    }
  }

  // NOTE: git add -A
  const addToIndexPromises = fileStatuses.map(([filepath, , workTreeStatus]) => (
    workTreeStatus === 0
      ? git.remove({ fs, dir: programPath, filepath })
      : git.add({ fs, dir: programPath, filepath })
  ));
  await Promise.all(addToIndexPromises);

  const newFileStatuses = await git.statusMatrix({ fs, dir: programPath });
  const workDirHasChanges = newFileStatuses.some(([, headStatus, workTreeStatus, stageStatus]) => (
    headStatus !== 1 || workTreeStatus !== 1 || stageStatus !== 1
  ));

  if (workDirHasChanges) {
    await git.commit({
      fs,
      dir: programPath,
      message: '@hexlet/cli: submit',
      author,
    });
  } else {
    console.log(chalk.grey('Nothing changed. Skip commiting'));
  }

  const localLog = await git.log({ fs, dir: programPath, ref: branch });
  const remoteLog = await git.log({ fs, dir: programPath, ref: `origin/${branch}` });
  const localHistoryAhead = !_.isEqual(localLog, remoteLog);

  if (localHistoryAhead) {
    const fileStatusesWithRemoteBranch = await git.statusMatrix({ fs, dir: programPath, ref: `origin/${branch}` });
    const exerciseRegEpx = /^exercises\/([^/.]+)\/.*$/;
    const exerciseNames = fileStatusesWithRemoteBranch
      .filter(([filepath, , workTreeStatus]) => (
        workTreeStatus !== 1 && exerciseRegEpx.test(filepath)
      ))
      .map(([filepath]) => exerciseRegEpx.exec(filepath)[1]);
    const uniqueExerciseNames = _.uniq(exerciseNames);

    await git.push({
      fs,
      http,
      dir: programPath,
      onAuth: () => ({ username: 'oauth2', password: gitlabToken }),
      remote: 'origin',
      ref: branch,
    });

    console.log(chalk.green(`Exercises have been submitted! Open ${programs[program].gitlabUrl}`));
    console.log(chalk.yellow(`Changed exercises:\n${uniqueExerciseNames.join('\n')}`));
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
