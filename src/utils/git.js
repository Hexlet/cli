// @ts-check

const fs = require('fs');
const http = require('isomorphic-git/http/node');
const git = require('isomorphic-git');
const debug = require('debug');
const _ = require('lodash');
const path = require('path');

const log = debug('hexlet');

const gitNormalizePath = (filePath) => {
  const filePathParts = filePath.split(path.sep);
  return filePathParts.join('/');
};

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

const gitAdd = async ({ dir, filepath }) => {
  const normalizedFilePath = filepath === '.' ? filepath : `${gitNormalizePath(filepath)}/`;
  const fileStatuses = await git.statusMatrix({ fs, dir, filepaths: [normalizedFilePath] });

  const addToIndexPromises = fileStatuses.map(([filePath, , workTreeStatus]) => (
    workTreeStatus === 0
      ? git.remove({ fs, dir, filepath: filePath })
      : git.add({ fs, dir, filepath: filePath })
  ));

  await Promise.all(addToIndexPromises);
};

const gitAddAll = ({ dir }) => gitAdd({ dir, filepath: '.' });

const gitIsWorkDirChanged = async ({ dir, filepath = '.' }) => {
  const normalizedFilePath = filepath === '.' ? filepath : `${gitNormalizePath(filepath)}/`;
  const fileStatuses = await git.statusMatrix({ fs, dir, filepaths: [normalizedFilePath] });

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

const gitPush = async ({ dir, ref = 'main', token = null }) => {
  const customOptions = {};

  if (!_.isNull(token)) {
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
    dir, url, ref = 'main', remote = 'origin', token,
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
    remote,
    noCheckout,
    force,
    ...customOptions,
  });

  await git.writeRef({
    fs,
    dir,
    ref: `refs/remotes/${remote}/HEAD`,
    value: `refs/remotes/${remote}/${ref}`,
    symbolic: true,
    force: true,
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

const gitRemove = async ({ dir, filepath }) => {
  const normalizedFilePath = gitNormalizePath(filepath);
  await git.remove({
    fs,
    dir,
    filepath: normalizedFilePath,
  });
};

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

const gitSetUpstream = async ({ dir, remote = 'origin', ref }) => {
  await git.setConfig({
    fs,
    dir,
    path: `branch.${ref}.remote`,
    value: remote,
  });

  await git.setConfig({
    fs,
    dir,
    path: `branch.${ref}.merge`,
    value: `refs/heads/${ref}`,
  });
};

const gitBranchExists = async ({ dir, ref, remote = null }) => {
  const branches = await git.listBranches({
    fs,
    dir,
    remote,
  });

  return branches.includes(ref);
};

const gitIsLocalHistoryAhead = async ({ dir, ref, remote = 'origin' }) => {
  const localLog = await gitLog({ dir, ref });
  const remoteLog = await gitLog({ dir, ref: `${remote}/${ref}` });
  return !_.isEqual(localLog, remoteLog);
};

const gitHasChangesToCommit = async ({ dir, checkedPaths }) => {
  const promises = checkedPaths.map((checkedPath) => (
    gitIsWorkDirChanged({
      dir,
      filepath: checkedPath,
    })
  ));
  const changeStatuses = await Promise.all(promises);
  return changeStatuses.some(_.identity);
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
  setUpstream: gitSetUpstream,
  branchExists: gitBranchExists,
  isLocalHistoryAhead: gitIsLocalHistoryAhead,
  hasChangesToCommit: gitHasChangesToCommit,
  normalizePath: gitNormalizePath,
};
