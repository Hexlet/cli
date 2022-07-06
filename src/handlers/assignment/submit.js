// @ts-check

const chalk = require('chalk');
const debug = require('debug');
const _ = require('lodash');
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
    author, branch,
    generateRepoPath, hexletConfigPath, hexletTemplatesPath,
  } = initSettings(customSettings);

  const {
    hexletDir, githubToken, assignments,
  } = await readHexletConfig(hexletConfigPath, entityName);

  const repoPath = generateRepoPath(hexletDir);
  const { courseSlugWithLocale, lessonSlug } = getAssignmentData(process.cwd(), repoPath);
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

  const templatePaths = await updateTemplates(hexletTemplatesPath, repoPath);
  const currentPath = await updateCurrent(repoPath, assignmentRelativePath);

  const checkedPaths = [...templatePaths, currentPath, assignmentRelativePath];
  const promises = checkedPaths.map((checkedPath) => (
    git.isWorkDirChanged({
      dir: repoPath,
      checkedPath,
    })
  ));
  const changeStatuses = await Promise.all(promises);
  const hasChangesToCommit = changeStatuses.some(_.identity);

  if (hasChangesToCommit) {
    await git.commit({
      dir: repoPath,
      message: `submit ${assignmentRelativePath}`,
      author,
    });
  } else {
    console.log(chalk.grey('Nothing changed. Skip committing.'));
  }

  const localLog = await git.log({ dir: repoPath, ref: branch });
  const remoteLog = await git.log({ dir: repoPath, ref: `origin/${branch}` });
  const localHistoryAhead = !_.isEqual(localLog, remoteLog);

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
