// @ts-check

const path = require('path');
const fse = require('fs-extra');
const _ = require('lodash');

const git = require('./git.js');

const getEntityName = (params) => {
  const commandParts = _.get(params, '_');
  return _.first(commandParts);
};

const updateTemplates = async (hexletTemplatesPath, repoPath, preferredLocale) => {
  const templatesPath = path.join(hexletTemplatesPath, 'assignments');
  const templates = [
    { fileName: `README.${preferredLocale}.md`, destPath: 'README.md' },
    { fileName: 'hexlet-check.yml', destPath: path.join('.github', 'workflows', 'hexlet-check.yml') },
  ];

  const promises = templates.map(async ({ fileName, destPath }) => {
    await fse.copy(
      path.join(templatesPath, fileName),
      path.join(repoPath, destPath),
    );
    await git.add({ dir: repoPath, filepath: destPath });
    return destPath;
  });
  const templatePaths = await Promise.all(promises);

  return templatePaths;
};

const updateCurrent = async (repoPath, courseSlugWithLocale, lessonSlug) => {
  const currentName = '.current.json';
  const currentPath = path.join(repoPath, currentName);

  const data = { assignment: `${courseSlugWithLocale}/${lessonSlug}` };
  await fse.writeJSON(currentPath, data);
  await git.add({ dir: repoPath, filepath: currentName });

  return currentName;
};

module.exports = {
  getEntityName,
  updateTemplates,
  updateCurrent,
};
