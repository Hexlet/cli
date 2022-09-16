// @ts-check

const readdirp = require('readdirp');
const path = require('path');
const _ = require('lodash');
const fsp = require('fs/promises');

const readDirP = async (dirPath) => {
  const filesInfo = await readdirp.promise(dirPath, {
    alwaysStat: true,
    directoryFilter: ['!.git'],
  });

  const filesData = filesInfo.map((fileInfo) => ({
    path: fileInfo.path.split(path.sep).join('/'),
    name: fileInfo.basename,
    size: BigInt(fileInfo.stats.size),
  }));

  return _.sortBy(filesData, 'path');
};

const getFixturePath = (filePath) => (
  path.join(__dirname, '..', '..', '__fixtures__', filePath)
);

const readFile = (filePath) => fsp.readFile(filePath, 'utf-8');

const getProgramConfig = ({ hexletDir, program, remoteUrl }) => ({
  hexletUserId: '123',
  gitlabToken: 'some-gitlab-token',
  hexletDir,
  programs: {
    [program]: {
      gitlabUrl: remoteUrl ?? 'https://remote-repo-url',
      gitlabGroupId: '456789',
    },
  },
});

const getAssignmentConfig = ({ hexletDir, remoteUrl }) => ({
  hexletDir,
  hexletToken: 'some-hexlet-token',
  githubToken: 'some-github-token',
  preferredLocale: 'ru',
  assignments: {
    githubUrl: remoteUrl ?? 'https://remote-repo-url',
  },
});

module.exports = {
  readDirP,
  getFixturePath,
  readFile,
  getProgramConfig,
  getAssignmentConfig,
};
