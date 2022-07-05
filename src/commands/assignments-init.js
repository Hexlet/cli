// @ts-check

const debug = require('debug');
const fse = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const os = require('os');
const { Octokit } = require('@octokit/rest');
const _ = require('lodash');

const github = require('../utils/github.js');
const { initSettings, readHexletConfig } = require('../config.js');
const { getEntityName, updateTemplates } = require('../utils/index.js');
const git = require('../utils/git.js');

const log = debug('hexlet');

const prepareConfig = async (options) => {
  const {
    hexletConfigDir, hexletConfigPath, hexletDir, entityName,
    githubToken, hexletToken, projectUrl,
  } = options;

  let previousData = {};

  await fse.ensureDir(hexletDir);
  await fse.ensureDir(hexletConfigDir);
  try {
    previousData = await fse.readJson(hexletConfigPath);
  } catch (err) {
    // NOTE: предыдущей конфигурации локально нет
  }

  const data = {
    ...previousData,
    githubToken,
    hexletToken,
    hexletDir,
    assignments: {
      githubUrl: projectUrl,
    },
  };

  await fse.writeJson(hexletConfigPath, data);
  console.log(chalk.grey(`Config wrote to: ${hexletConfigPath}`));

  await readHexletConfig(hexletConfigPath, entityName);

  return data;
};

const handler = async (params, customSettings = {}) => {
  const {
    githubToken, hexletToken,
  } = params;

  log('params', params);
  const entityName = getEntityName(params);

  await github.checkToken({ token: githubToken });
  const owner = await github.getOwner({ token: githubToken });
  // TODO: добавить чек токена Хекслета (нужна логика в API хекслета)

  const {
    repo, author, branch,
    hexletConfigDir, hexletConfigPath, hexletTemplatesPath,
  } = initSettings(customSettings);

  const octokit = new Octokit({ auth: githubToken });

  log('create repository');
  let response;
  try {
    response = await octokit.rest.repos.createForAuthenticatedUser(repo);
  } catch (e) {
    if (e.status !== 422) {
      throw e;
    }
    response = await octokit.rest.repos.get({ owner, repo: repo.name });
  }
  const { data: projectData } = response;
  console.log(chalk.grey(`Github repository url: ${projectData.html_url}`));

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
    ...params, hexletConfigDir, hexletConfigPath, projectUrl: projectData.html_url, entityName,
  });

  const repoPath = path.join(hexletDir, repo.name);
  const remoteBranchExists = await github.branchExists({ owner, repo: repo.name, branch });

  log(`git clone ${projectData.clone_url} to ${repoPath}`);
  await git.clone({
    dir: repoPath,
    ref: branch,
    url: projectData.clone_url,
    singleBranch: true,
    noCheckout: true,
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

  await updateTemplates(hexletTemplatesPath, repoPath);

  await git.commit({
    dir: repoPath,
    message: 'configure',
    author,
  });

  try {
    await git.renameBranch({ dir: repoPath, ref: branch, oldref: 'master' });
  } catch (e) {
    if (!(e instanceof git.Errors.AlreadyExistsError)) {
      throw e;
    }
  }

  await git.push({
    dir: repoPath,
    ref: branch,
    token: githubToken,
  });

  console.log(chalk.grey(`Path to assignments: ${repoPath}`));
  console.log();

  console.log(chalk.green(`File structure has been prepared! Follow instructions located at ${repoPath}/README.md`));

  return { hexletConfigPath };
};

const obj = {
  command: 'assignments init',
  description: 'Init assignments repository',
  builder: (yargs) => {
    yargs.option('github-token', {
      description: 'Github Token',
      required: true,
      type: 'string',
    });
    yargs.option('hexlet-token', {
      description: 'Hexlet token',
      required: true,
      type: 'string',
    });
    yargs.option('hexlet-dir', {
      description: 'Path to Hexlet directory',
      required: false,
      type: 'string',
      default: path.join(os.homedir(), 'Hexlet'),
    });
    yargs.coerce('hexlet-dir', (opt) => path.resolve(process.cwd(), opt));
  },
  handler,
};

module.exports = obj;
