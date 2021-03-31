// @ts-check

const fse = require('fs-extra');
const fs = require('fs');
const http = require('isomorphic-git/http/node');
// const path = require('path');
// const debug = require('debug');
const git = require('isomorphic-git');

// const log = debug('hexlet');

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
    ref: branch,
    singleBranch: true,
    onAuth: () => ({ username: 'oauth2', password: token }),
    author: {
      name: '@hexlet/cli',
      email: 'support@hexlet.io',
    },
  });

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
  Promise.all(promises);

  if (promises.length > 0) {
    await git.commit({
      fs,
      dir: programPath,
      message: '@hexlet/cli: submit',
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
  } else {
    console.log('Nothing changed. Skip commiting');
  }
};

const obj = {
  command: 'submit <program>',
  description: 'Submit exercises',
  builder: () => {},
  handler,
};

module.exports = obj;
