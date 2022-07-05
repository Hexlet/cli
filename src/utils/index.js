// @ts-check

const path = require('path');
const fse = require('fs-extra');
const _ = require('lodash');

const git = require('./git.js');

const getEntityName = (params) => {
  const commandParts = _.get(params, '_');
  return _.first(commandParts);
};

const updateTemplates = async (hexletTemplatesPath, repoPath) => {
  const templatesPath = path.join(hexletTemplatesPath, 'assignments');
  const templates = [
    { fileName: 'README.md', destPath: 'README.md' },
    { fileName: 'hexlet-check.yml', destPath: path.join('.github', 'workflows', 'hexlet-check.yml') },
  ];

  const promises = templates.map(async ({ fileName, destPath }) => {
    await fse.copy(
      path.join(templatesPath, fileName),
      path.join(repoPath, destPath),
    );
    await git.add({ dir: repoPath, filepath: destPath });
  });
  await Promise.all(promises);
};

module.exports = {
  getEntityName,
  updateTemplates,
};
