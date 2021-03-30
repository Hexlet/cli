// @ts-check

const fse = require('fs-extra');
const fs = require('fs');
const http = require('isomorphic-git/http/node');
// const path = require('path');
const debug = require('debug');
const git = require('isomorphic-git');

const log = debug('hexlet');

const initSettings = require('../../settings.js');

const handler = async ({
  program,
}, customSettings = {}) => {
  const {
    generateHexletProgramPath, hexletConfigPath, branch,
  } = initSettings(customSettings);

  const { token } = await fse.readJson(hexletConfigPath);
  const programPath = generateHexletProgramPath(program);

  // FIXME: add "git pull --rebase"
  await git.pull({
    fs,
    http,
    dir: programPath,
    fastForwardOnly: true,
    ref: branch,
    singleBranch: true,
    onAuth: () => ({ username: 'oauth2', password: token }),
    author: {
      name: '@hexlet/cli',
      email: 'support@hexlet.io',
    },
  });

  const statuses = await git.statusMatrix({ fs, dir: programPath });
  const promises = statuses.map(([filepath, , worktreeStatus]) => {
    if (worktreeStatus) {
      return git.add({ fs, dir: programPath, filepath });
    }
    return git.remove({ fs, dir: programPath, filepath });
  });
  Promise.all(promises);

  // FIXME: only when changed
  await git.commit({
    fs,
    dir: programPath,
    message: 'auto save',
    author: {
      name: '@hexlet/cli',
      email: 'support@hexlet.io',
    },
  });

  await git.push({
    fs,
    http,
    dir: programPath,
    // url: repoUrl,
    onAuth: () => ({ username: 'oauth2', password: token }),
    remote: 'origin',
    ref: branch,
  });

  console.log('Check the repository');
};

const obj = {
  command: 'submit <program>',
  description: 'Submit exercises',
  builder: () => {},
  handler,
};

module.exports = obj;
