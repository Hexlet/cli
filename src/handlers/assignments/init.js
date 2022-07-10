// @ts-check

const debug = require('debug');
const fse = require('fs-extra');
const chalk = require('chalk');
const _ = require('lodash');

const github = require('../../utils/github.js');
const { initSettings, prepareConfig } = require('../../config.js');
const { getEntityName, updateTemplates } = require('../../utils/index.js');
const git = require('../../utils/git.js');
const hexlet = require('../../utils/hexlet.js');

const log = debug('hexlet');

module.exports = async (params, customSettings = {}) => {
  const {
    githubToken, hexletToken,
  } = params;

  log('params', params);
  const entityName = getEntityName(params);

  await github.checkToken({ token: githubToken });
  const owner = await github.getOwner({ token: githubToken });
  await hexlet.checkToken({ token: hexletToken });

  const {
    repo, author, branch,
    hexletConfigDir, hexletConfigPath, hexletTemplatesPath,
    generateRepoPath,
  } = initSettings(customSettings);

  log('create repository');
  const repoData = await github.getRepository({ repo: repo.name, owner })
    ?? await github.createRepository({ token: githubToken, repo });
  console.log(chalk.grey(`Github repository url: ${repoData.html_url}`));

  log('set secret to repository');
  await github.setRepoSecret({
    token: githubToken,
    owner,
    repo: repo.name,
    name: 'HEXLET_TOKEN',
    value: hexletToken,
  });

  log('prepare and write config');
  const { hexletDir } = await prepareConfig({
    ...params, hexletConfigDir, hexletConfigPath, projectUrl: repoData.html_url, entityName,
  });

  const repoPath = generateRepoPath(hexletDir);
  const remoteBranchExists = await github.branchExists({ owner, repo: repo.name, branch });
  const localRepoExists = await fse.pathExists(repoPath);

  log(`git clone ${repoData.clone_url} to ${repoPath}`);
  await git.clone({
    dir: repoPath,
    ref: branch,
    url: repoData.clone_url,
    singleBranch: true,
    noCheckout: localRepoExists,
    force: true, // NOTE: обновляем remote url
  });

  // NOTE: инициализация должна происходить в рабочей ветке (main) или в новом репозитории
  const currentBranch = await git.currentBranch({ dir: repoPath });
  if (!_.isUndefined(currentBranch) && currentBranch !== branch) {
    throw new Error(chalk.red(`Change current branch to ${branch}`));
  }

  if (remoteBranchExists) {
    await git.pullMerge({
      dir: repoPath,
      ref: branch,
      author,
    });
  }

  const templatePaths = await updateTemplates(hexletTemplatesPath, repoPath);
  const changesToCommit = await git.hasChangesToCommit({
    dir: repoPath,
    checkedPaths: templatePaths,
  });

  if (changesToCommit) {
    await git.commit({
      dir: repoPath,
      message: 'configure',
      author,
    });
  } else {
    console.log(chalk.grey('Nothing changed. Skip committing.'));
  }

  try {
    await git.renameBranch({ dir: repoPath, ref: branch, oldref: 'master' });
  } catch (e) {
    if (!(e instanceof git.Errors.AlreadyExistsError)) {
      throw e;
    }
  }

  const locallyRemoteBranchExists = await git.branchExists({
    dir: repoPath,
    ref: 'main',
    remote: 'origin',
  });

  const localHistoryAhead = locallyRemoteBranchExists
    ? await git.isLocalHistoryAhead({ dir: repoPath, ref: branch })
    : true;

  if (localHistoryAhead) {
    await git.setUpstream({
      dir: repoPath,
      ref: branch,
    });

    await git.push({
      dir: repoPath,
      ref: branch,
      token: githubToken,
    });
  } else {
    console.log(chalk.grey('Nothing to push. Skip pushing.'));
  }

  console.log(chalk.grey(`Path to assignments: ${repoPath}`));
  console.log();
  console.log(chalk.green('File structure has been prepared!'));
  console.log(chalk.cyan(`Follow instructions located at ${repoPath}/README.md`));

  return { hexletConfigPath };
};
