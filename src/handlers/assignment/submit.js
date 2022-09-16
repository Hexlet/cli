// @ts-check

const chalk = require('chalk');
const debug = require('debug');
const path = require('path');

const log = debug('hexlet');

const { initSettings, readHexletConfig } = require('../../config.js');
const {
  getEntityName, updateTemplates, updateCurrent,
} = require('../../utils/index.js');
const { getAssignmentData } = require('../../utils/assignments.js');
const git = require('../../utils/git.js');

module.exports = async (params, customSettings = {}) => {
  const entityName = getEntityName(params);

  const {
    author, branch, cwdPath,
    generateRepoPath, hexletConfigPath, hexletTemplatesPath,
  } = initSettings(customSettings);

  const {
    hexletDir, githubToken, assignments, preferredLocale,
  } = await readHexletConfig(hexletConfigPath, entityName);

  const repoPath = generateRepoPath(hexletDir);
  const { courseSlugWithLocale, lessonSlug } = getAssignmentData(cwdPath, repoPath);
  const assignmentRelativePath = path.join(courseSlugWithLocale, lessonSlug);
  log('assignment path', assignmentRelativePath);

  await git.pullMerge({
    dir: repoPath,
    ref: branch,
    author,
  });

  await git.add({
    dir: repoPath,
    filepath: assignmentRelativePath,
  });

  await updateTemplates(hexletTemplatesPath, repoPath, preferredLocale);
  const currentPath = await updateCurrent(repoPath, courseSlugWithLocale, lessonSlug);
  const changesToCommit = await git.hasChangesToCommit({
    dir: repoPath,
    checkedPaths: [currentPath, assignmentRelativePath],
  });

  if (changesToCommit) {
    await git.commit({
      dir: repoPath,
      message: `submit ${git.normalizePath(assignmentRelativePath)}`,
      author,
    });
  } else {
    console.log(chalk.grey('Nothing changed. Skip committing.'));
  }

  const localHistoryAhead = await git.isLocalHistoryAhead({ dir: repoPath, ref: branch });

  if (localHistoryAhead) {
    await git.push({
      dir: repoPath,
      ref: branch,
      token: githubToken,
    });

    console.log(chalk.green(`Assignment ${assignmentRelativePath} have been submitted!`));
    console.log(chalk.cyan(`Open ${assignments.githubUrl}`));
  } else {
    console.log(chalk.grey('Nothing to push. Skip pushing.'));
  }
};
