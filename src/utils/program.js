// @ts-check

const fs = require('fs');
const git = require('isomorphic-git');
const _ = require('lodash');

module.exports.getChangedExercises = async ({ dir, ref }) => {
  const fileStatusesWithRemoteBranch = await git.statusMatrix({ fs, dir, ref });
  const exerciseRegEpx = /^exercises\/([^/.]+)\/.*$/;
  const exerciseNames = fileStatusesWithRemoteBranch
    .filter(([filepath, , workTreeStatus]) => (
      workTreeStatus !== 1 && exerciseRegEpx.test(filepath)
    ))
    .map(([filepath]) => exerciseRegEpx.exec(filepath)[1]);

  return _.uniq(exerciseNames);
};
