// @ts-check

const fsp = require('fs/promises');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const debug = require('debug');
const fse = require('fs-extra');
const path = require('path');
const git = require('isomorphic-git');
const chalk = require('chalk');
const { Gitlab } = require('@gitbeaker/node');

const initSettings = require('../../settings.js');

const log = debug('hexlet');

const prepareConfig = async (params) => {
  const {
    hexletConfigPath, groupId, token, userId, program, project,
  } = params;

  let data = {};

  fse.ensureDir(path.dirname(hexletConfigPath));
  try {
    if (await fse.pathExists(hexletConfigPath)) {
      data = await fse.readJson(hexletConfigPath);
    }
  } catch (err) {
    // nothing
  }

  data.userId = userId;
  data.token = token;
  if (!data.programs) {
    data.programs = { [program]: {} };
  }
  data.programs[program] = {
    gitlabUrl: project.web_url,
    groupId,
  };

  await fse.writeJson(hexletConfigPath, data);
  console.log(chalk.grey(`Config: ${hexletConfigPath}`));
};

const handler = async (params) => {
  const {
    groupId, userId, token, customSettings = {},
  } = params;
  log('params', params);

  const {
    author, branch, hexletConfigPath, hexletDir, hexletTemplatesPath,
  } = initSettings(customSettings);

  const api = new Gitlab({
    token,
  });

  const namespace = await api.Namespaces.show(groupId);
  log(namespace);
  const program = namespace.full_path.split('/')[2];

  const projectId = path.join(namespace.full_path, userId);
  let project;
  try {
    project = await api.Projects.create({
      name: userId,
      namespace_id: groupId,
    });
  } catch (e) {
    log(e);
    project = await api.Projects.show(projectId);
  }
  log('project', project);
  console.log(chalk.grey(`Gitlab repository: ${project.web_url}`));

  prepareConfig({
    ...params, hexletConfigPath, program, project
  });

  const programTemplateDir = path.join(hexletTemplatesPath, 'program');
  const programTemplatePaths = await fsp.readdir(programTemplateDir);
  const promises = programTemplatePaths.map(async (templatePath) => {
    let action;
    try {
      await api.RepositoryFiles.show(projectId, templatePath, branch);
      action = 'update';
    } catch (e) {
      action = 'create';
    }
    const fullPath = path.join(programTemplateDir, templatePath);
    const content = await fsp.readFile(fullPath, 'utf-8');
    const commitAction = {
      action,
      content,
      filePath: templatePath,
    };
    return commitAction;
  });
  const commitActions = await Promise.all(promises);
  await api.Commits.create(projectId, branch, '@hexlet/cli: configure', commitActions);

  const programPath = path.join(hexletDir, program);
  log(`git clone ${project.ssh_url_to_repo} ${programPath}`);

  await git.clone({
    fs,
    http,
    dir: programPath,
    onAuth: () => ({ username: 'oauth2', password: token }),
    url: project.http_url_to_repo,
    singleBranch: true,
    ref: branch,
  });

  await git.pull({
    fs,
    http,
    dir: programPath,
    ref: branch,
    singleBranch: true,
    onAuth: () => ({ username: 'oauth2', password: token }),
    author,
  });

  console.log(chalk.grey(`Program name: ${program}`));
  console.log(chalk.grey(`Program path: ${programPath}`));
  console.log();

  console.log(chalk.green(`File structure has been prepared! Follow instructions located at ${programPath}/README.md`));

  return { hexletConfigPath };
};

const obj = {
  command: 'init <groupId> <userId>',
  description: 'Init repository',
  builder: (yargs) => {
    yargs.option('token', {
      description: 'Gitlab Token',
      required: true,
      type: 'string',
    });
    yargs.positional('groupId', {
      description: 'Gitlab Group Id',
      // required: true,
      type: 'string',
    });
    yargs.positional('userId', {
      description: 'Hexlet User Id',
      // required: true,
      type: 'string',
    });
  },
  handler,
};

module.exports = obj;
