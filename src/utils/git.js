// @ts-check

const fs = require('fs');
const http = require('isomorphic-git/http/node');
const git = require('isomorphic-git');
const debug = require('debug');

const log = debug('hexlet');

const gitPull = async (options) => {
  const {
    dir, ref, token, author,
  } = options;

  await git.pull({
    fs,
    http,
    dir,
    ref,
    singleBranch: true,
    onAuth: () => ({ username: 'oauth2', password: token }),
    author,
  });
};

const gitPullMerge = async (options) => {
  const { dir } = options;
  const fileStatuses = await git.statusMatrix({ fs, dir });

  // NOTE: решение проблемы со стиранием staged файлов при pull
  const resetIndexPromises = fileStatuses
    .filter(([, , workTreeStatus, stagedStatus]) => {
      const existAndStaged = stagedStatus === 2 || stagedStatus === 3;
      const deletedAndStaged = workTreeStatus === 0 && stagedStatus === 0;
      return existAndStaged || deletedAndStaged;
    })
    .map(([filepath]) => (
      git.resetIndex({ fs, dir, filepath })
    ));

  log(resetIndexPromises.length);
  await Promise.all(resetIndexPromises);

  try {
    // NOTE: pull стирает stagged файлы
    await gitPull(options);
  } catch (e) {
    // NOTE: внутри git.pull вызывается git.checkout без установленной опции force (это хорошо)
    // потому коммит из удалённого репозитория пулится, но в рабочей директории
    // остаются файлы с локальными изменениями (состояние рабочей директории приоритетно).
    // Решение конфиликтов (см. тесты)
    if (!(e instanceof git.Errors.CheckoutConflictError)) {
      throw e;
    }
  }
};

const gitAddAll = async ({ dir }) => {
  const fileStatuses = await git.statusMatrix({ fs, dir });

  const addToIndexPromises = fileStatuses.map(([filepath, , workTreeStatus]) => (
    workTreeStatus === 0
      ? git.remove({ fs, dir, filepath })
      : git.add({ fs, dir, filepath })
  ));

  await Promise.all(addToIndexPromises);
};

const gitIsWorkDirChanged = async ({ dir }) => {
  const fileStatuses = await git.statusMatrix({ fs, dir });

  return fileStatuses.some(([, headStatus, workTreeStatus, stageStatus]) => (
    headStatus !== 1 || workTreeStatus !== 1 || stageStatus !== 1
  ));
};

const gitCommit = ({ dir, author, message }) => (
  git.commit({
    fs,
    dir,
    message,
    author,
  })
);

const gitPush = ({ dir, ref, token }) => (
  git.push({
    fs,
    http,
    dir,
    onAuth: () => ({ username: 'oauth2', password: token }),
    remote: 'origin',
    ref,
  })
);

const gitLog = ({ dir, ref }) => (
  git.log({
    fs,
    dir,
    ref,
  })
);

const gitClone = async (options) => {
  const {
    dir, ref, token, url, noCheckout = false,
  } = options;

  await git.clone({
    fs,
    http,
    dir,
    onAuth: () => ({ username: 'oauth2', password: token }),
    url,
    singleBranch: true,
    ref,
    noCheckout,
  });
};

const gitDeleteRemote = ({ dir }) => (
  git.deleteRemote({
    fs,
    dir,
    remote: 'origin',
  })
);

module.exports = {
  Errors: git.Errors,
  pull: gitPull,
  pullMerge: gitPullMerge,
  addAll: gitAddAll,
  isWorkDirChanged: gitIsWorkDirChanged,
  commit: gitCommit,
  push: gitPush,
  log: gitLog,
  clone: gitClone,
  deleteRemote: gitDeleteRemote,
};
