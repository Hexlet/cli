const git = require('isomorphic-git');
const fs = require('fs');
const http = require('isomorphic-git/http/node');

const gitClone = (url, dir) => (
  git.clone({
    fs,
    http,
    dir,
    url,
  })
);

const gitRemoteSetUrl = (remote, url, dir) => (
  git.addRemote({
    fs,
    dir,
    remote,
    url,
    force: true,
  })
);

const gitLog = async (ref, dir) => {
  const commitData = await git.log({
    fs,
    dir,
    ref,
  });

  return commitData
    .map((data) => data.commit.message.trim());
};

const gitLsFiles = (dir) => (
  git.statusMatrix({
    fs,
    dir,
  })
);

const gitAdd = (filepath, dir) => (
  git.add({
    fs,
    dir,
    filepath,
  })
);

const gitAddAll = async (dir) => {
  const fileStatuses = await git.statusMatrix({ fs, dir });

  const addToIndexPromises = fileStatuses.map(([filepath, , workTreeStatus]) => (
    workTreeStatus === 0
      ? git.remove({ fs, dir, filepath })
      : git.add({ fs, dir, filepath })
  ));

  await Promise.all(addToIndexPromises);
};

const gitRemove = (filepath, dir) => (
  git.remove({
    fs,
    dir,
    filepath,
  })
);

const gitCommit = (message, author, dir) => (
  git.commit({
    fs,
    dir,
    message,
    author,
  })
);

module.exports = {
  gitClone,
  gitRemoteSetUrl,
  gitLog,
  gitLsFiles,
  gitAdd,
  gitAddAll,
  gitRemove,
  gitCommit,
};
