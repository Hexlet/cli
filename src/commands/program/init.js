// @ts-check

const fsp = require('fs/promises');
const http = require('isomorphic-git/http/node')
const fs = require('fs');
const debug = require('debug');
const fse = require('fs-extra');
const path = require('path');
const git = require('isomorphic-git');
const { Gitlab } = require('@gitbeaker/node');

const initSettings = require('../../settings.js');

const log = debug('hexlet');

const handler = async ({
  program, groupId, userId, token,
}, customSettings = {}) => {
  const {
    branch, hexletConfigPath, hexletDir, hexletTemplatesPath,
  } = initSettings(customSettings);

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
    data.programs = {};
  }
  data.programs[program] = groupId;

  const api = new Gitlab({
    token,
  });

  const namespace = await api.Namespaces.show(groupId);
  const projectId = path.join(namespace.full_path, `${userId}`);
  let project;
  try {
    project = await api.Projects.create({
      name: userId,
      namespace_id: groupId,
    });
  } catch (e) {
    project = await api.Projects.show(projectId);
  }
  console.log(`Repository Home: ${project.web_url}`);

  // const sshRepoUrl = `https://oauth2:${token}@gitlab.com/${project.path_with_namespace}`;
  // console.log(project);
  // data.gitRepoUrl = project.ssh_url_to_repo;

  await fse.writeJson(hexletConfigPath, data);
  console.log(`Config created: ${hexletConfigPath}`);

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
  await api.Commits.create(projectId, branch, 'configure (auto)', commitActions);

  // console.log(namespace);
  const localPath = path.join(hexletDir, program);
  log(`COMMAND: git clone ${project.ssh_url_to_repo} ${localPath}`);

  try {
    await git.clone({
      fs,
      http,
      dir: localPath,
      onAuth: () => ({ username: 'oauth2', password: token }),
      // corsProxy: 'https://cors.isomorphic-git.org',
      url: project.http_url_to_repo,
      singleBranch: true,
      ref: branch,
    });
  } catch (e) {
    if (e.code !== 'AlreadyExistsError') {
      throw e;
    }
    console.log('Repository already exists');
  }

  return { hexletConfigPath };
};

const obj = {
  command: 'init <program> <groupId> <userId>',
  description: 'Init repository',
  builder: (yargs) => yargs.option('token', {
    description: 'Gitlab Token',
    required: true,
    type: 'string',
  }),
  handler,
};

module.exports = obj;
