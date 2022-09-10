// @ts-check

const debug = require('debug');
const _ = require('lodash');
const path = require('path');
const fsp = require('fs/promises');
const chalk = require('chalk');
const fse = require('fs-extra');
const { Gitlab } = require('@gitbeaker/node');

const git = require('../../utils/git.js');
const { initSettings, readHexletConfig } = require('../../config.js');
const { getEntityName } = require('../../utils/index.js');
const programsAssignments = require('../../programsAssignments.js');
const {
  makeAssignmentBackup, generateAssignmentPath,
} = require('../../utils/assignments.js');

const log = debug('hexlet');

const getMigrationData = (exerciseName, program, exercisesPath, repoPath) => {
  const { courseSlug, lessonSlug } = _.get(programsAssignments, [program, exerciseName], {});
  // NOTE: program exercises have only ru locale
  const locale = 'ru';

  const exercisePath = path.join(exercisesPath, exerciseName);
  const assignmentPath = lessonSlug && courseSlug
    ? generateAssignmentPath(repoPath, courseSlug, lessonSlug, locale)
    : path.join(repoPath, 'programs', program, exerciseName);

  return { exercisePath, assignmentPath };
};

module.exports = async (params, customSettings = {}) => {
  const { program, skipImportGitlab } = params;

  const entityName = getEntityName(params);

  const {
    author, branch,
    generateRepoPath, hexletConfigPath,
    generateHexletProgramPath,
  } = initSettings(customSettings);

  const {
    hexletDir, assignments, programs,
    githubToken, gitlabToken,
  } = await readHexletConfig(hexletConfigPath, entityName);

  const repoPath = generateRepoPath(hexletDir);
  const programPath = generateHexletProgramPath(hexletDir, program);
  const exercisesPath = path.join(programPath, 'exercises');

  const exercisesPathExists = await fse.pathExists(exercisesPath);
  if (!exercisesPathExists) {
    throw new Error(chalk.red(`Directory '${exercisesPath}' does not exists.`));
  }

  const repoPathExists = await fse.pathExists(repoPath);
  if (!repoPathExists) {
    throw new Error(chalk.red(`Directory '${repoPath}' does not exists. Try to run 'init' command.`));
  }

  const repoBranch = await git.currentBranch({ dir: repoPath });
  const programBranch = await git.currentBranch({ dir: programPath });

  if (repoBranch !== branch) {
    throw new Error(chalk.red(`The '${repoPath}' branch should be '${branch}'`));
  }

  if (programBranch !== branch) {
    throw new Error(chalk.red(`The '${programBranch}' branch should be '${branch}'`));
  }

  const files = await fsp.readdir(exercisesPath, { withFileTypes: true });
  const exerciseNames = files
    .filter((file) => file.isDirectory())
    .map((dir) => dir.name);

  if (_.isEmpty(exerciseNames)) {
    console.log(chalk.gray(`Directory '${exercisesPath}' does not contain exercises. Skip migrating.`));
    return;
  }

  if (!skipImportGitlab) {
    const api = new Gitlab({
      token: gitlabToken,
    });

    const user = await api.Users.current();
    const projectName = `hexlet-${program}-program`;
    const projectPath = `${user.username}/${projectName}`;
    try {
      const project = await api.Projects.show(projectPath);
      throw new Error(chalk.red(`Repository '${project.web_url}' already exists`));
    } catch (e) {
      if (e.description !== '404 Project Not Found') {
        throw e;
      }
    }

    log('export remote repository to personal account', assignments.githubUrl);
    const hexletGitlabUrl = new URL(programs[program].gitlabUrl);
    hexletGitlabUrl.pathname = `${hexletGitlabUrl.pathname}.git`;
    hexletGitlabUrl.username = 'oauth2';
    hexletGitlabUrl.password = gitlabToken;

    const project = await api.Projects.create({
      name: projectName,
      importUrl: hexletGitlabUrl.toString(),
    });
    console.log(chalk.green(`Remote repository exported to: ${project.web_url}`));
  }

  log('copy exercises to assignments', repoPath);
  const copyPromises = exerciseNames
    .map((exerciseName) => getMigrationData(exerciseName, program, exercisesPath, repoPath))
    .map(async ({ exercisePath, assignmentPath }) => {
      const assignmentPathExists = await fse.pathExists(assignmentPath);
      if (assignmentPathExists) {
        const assignmentBackupPath = await makeAssignmentBackup(assignmentPath);
        console.log(chalk.gray(`The existing assignment has been moved to the ${assignmentBackupPath}`));
      }
      await fse.ensureDir(assignmentPath);
      await fse.copy(exercisePath, assignmentPath);
      await fse.copy(
        path.join(programPath, '.gitignore'),
        path.join(assignmentPath, '.gitignore'),
      );
      return assignmentPath;
    });
  const assignmentPaths = await Promise.all(copyPromises);

  log('update remote repository', assignments.githubUrl);
  await git.pullMerge({
    dir: repoPath,
    ref: branch,
    author,
  });

  const assignmentRelativePaths = assignmentPaths
    .map((assignmentPath) => path.relative(repoPath, assignmentPath));

  const gitAddPromises = assignmentRelativePaths.map((assignmentRelativePath) => (
    git.add({
      dir: repoPath,
      filepath: assignmentRelativePath,
    })
  ));
  await Promise.all(gitAddPromises);

  const changesToCommit = await git.hasChangesToCommit({
    dir: repoPath,
    checkedPaths: assignmentRelativePaths,
  });

  if (changesToCommit) {
    await git.commit({
      dir: repoPath,
      message: `migrate exercises from program ${program} to assignments`,
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

    console.log(chalk.green('Changes have been pushed!'));
    console.log(chalk.cyan(`Open ${assignments.githubUrl}`));
  } else {
    console.log(chalk.grey('Nothing to push. Skip pushing.'));
  }

  console.log(chalk.grey(`Path to assignments: ${repoPath}`));
  console.log();
  console.log(chalk.green(`Migration from ${programPath} to ${repoPath} finished!`));
};
