// @ts-check

const fsp = require('fs/promises');
const debug = require('debug');
const fse = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { Gitlab } = require('@gitbeaker/node');

const { initSettings } = require('../../config.js');
const git = require('../../utils/git.js');
const { getEntityName } = require('../../utils/index.js');

const log = debug('hexlet');

const prepareConfig = async (params) => {
  const {
    hexletConfigDir, hexletConfigPath, hexletDir,
    gitlabGroupId, gitlabToken, hexletUserId,
    program, project,
  } = params;

  let data = {};

  await fse.ensureDir(hexletDir);
  await fse.ensureDir(hexletConfigDir);
  try {
    data = await fse.readJson(hexletConfigPath);
  } catch (err) {
    // nothing
  }

  data.hexletUserId = hexletUserId;
  data.gitlabToken = gitlabToken;
  data.hexletDir = hexletDir;
  if (!data.programs) {
    data.programs = { [program]: {} };
  }
  data.programs[program] = {
    gitlabUrl: project.web_url,
    gitlabGroupId,
  };

  await fse.writeJson(hexletConfigPath, data);
  console.log(chalk.grey(`Config: ${hexletConfigPath}`));

  return data;
};

module.exports = async (params, customSettings = {}) => {
  const {
    gitlabGroupId, hexletUserId, gitlabToken,
  } = params;

  log('params', params);
  const entityName = getEntityName(params);

  const {
    author, branch, hexletConfigDir,
    hexletConfigPath, hexletTemplatesPath,
    generateHexletProgramPath,
  } = initSettings(customSettings);

  const api = new Gitlab({
    token: gitlabToken,
  });

  const namespace = await api.Namespaces.show(gitlabGroupId);
  log('namespace', namespace);
  const program = namespace.full_path.split('/')[2];

  const projectId = `${namespace.full_path}/${hexletUserId}`;
  let project;
  try {
    project = await api.Projects.create({
      name: hexletUserId,
      namespace_id: gitlabGroupId,
    });
  } catch (e) {
    log(e);
    project = await api.Projects.show(projectId);
  }
  log('project', project);
  console.log(chalk.grey(`Gitlab repository: ${project.web_url}`));

  const { hexletDir } = await prepareConfig({
    ...params, hexletConfigDir, hexletConfigPath, program, project, entityName,
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

  const programPath = generateHexletProgramPath(hexletDir, program);
  log(`git clone ${project.http_url_to_repo} ${programPath}`);

  // NOTE: решение с повторным init, включает решение конфликтов
  try {
    await git.deleteRemote({ dir: programPath });
  } catch (e) {
    // локально репозиторий отсутствует
  }

  await git.clone({
    dir: programPath,
    ref: branch,
    token: gitlabToken,
    url: project.http_url_to_repo,
    singleBranch: true,
    noCheckout: true,
  });

  try {
    await git.pull({
      dir: programPath,
      ref: branch,
      token: gitlabToken,
      author,
    });
  } catch (e) {
    if (!(e instanceof git.Errors.CheckoutConflictError)) {
      throw e;
    }
  }

  console.log(chalk.grey(`Program name: ${program}`));
  console.log(chalk.grey(`Program path: ${programPath}`));
  console.log();

  console.log(chalk.green(`File structure has been prepared! Follow instructions located at ${programPath}/README.md`));

  return { hexletConfigPath };
};
