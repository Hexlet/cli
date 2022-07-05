// @ts-check

const fs = require('fs');
const http = require('isomorphic-git/http/node');
const git = require('isomorphic-git');
const debug = require('debug');
const _ = require('lodash');

const log = debug('hexlet');

const gitPull = async (options) => {
  const {
    dir, ref = 'main', token, author, singleBranch = true,
  } = options;

  const customOptions = {};

  if (!_.isNil(token)) {
    customOptions.onAuth = () => ({ username: 'oauth2', password: token });
  }

  await git.pull({
    fs,
    http,
    dir,
    ref,
    singleBranch,
    author,
    ...customOptions,
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

const gitPush = async ({ dir, ref = 'main', token }) => {
  const customOptions = {};

  if (!_.isNil(token)) {
    customOptions.onAuth = () => ({ username: 'oauth2', password: token });
  }

  await git.push({
    fs,
    http,
    dir,
    remote: 'origin',
    ref: `refs/heads/${ref}`,
    ...customOptions,
  });
};

const gitLog = ({ dir, ref = 'main' }) => (
  git.log({
    fs,
    dir,
    ref,
  })
);

const gitLogMessages = async (options) => {
  const commitData = await gitLog(options);

  return commitData
    .map((data) => data.commit.message.trim());
};

const gitClone = async (options) => {
  const {
    dir, url, ref = 'main', token,
    noCheckout = false, singleBranch = false, force = false,
  } = options;

  const customOptions = {};

  if (!_.isNil(token)) {
    customOptions.onAuth = () => ({ username: 'oauth2', password: token });
  }

  await git.clone({
    fs,
    http,
    dir,
    url,
    singleBranch,
    ref,
    noCheckout,
    force,
    ...customOptions,
  });
};

const gitDeleteRemote = ({ dir, remote = 'origin' }) => (
  git.deleteRemote({
    fs,
    dir,
    remote,
  })
);

const gitRemoteSetUrl = ({ dir, url, remote = 'origin' }) => (
  git.addRemote({
    fs,
    dir,
    remote,
    url,
    force: true,
  })
);

const gitLsFiles = ({ dir }) => (
  git.statusMatrix({
    fs,
    dir,
  })
);

const gitAdd = ({ dir, filepath }) => (
  git.add({
    fs,
    dir,
    filepath,
  })
);

const gitRemove = ({ dir, filepath }) => (
  git.remove({
    fs,
    dir,
    filepath,
  })
);

const gitCurrentBranch = ({ dir }) => (
  git.currentBranch({
    fs,
    dir,
    test: true,
  })
);

const gitRenameBranch = async (options) => {
  const {
    dir, ref, oldref, checkout = true,
  } = options;

  await git.renameBranch({
    fs,
    dir,
    ref,
    remoteRef: ref,
    oldref,
    checkout,
  });
};

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
  remoteSetUrl: gitRemoteSetUrl,
  logMessages: gitLogMessages,
  lsFiles: gitLsFiles,
  add: gitAdd,
  remove: gitRemove,
  currentBranch: gitCurrentBranch,
  renameBranch: gitRenameBranch,
};
