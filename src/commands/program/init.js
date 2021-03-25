// @ts-check

const fsp = require('fs/promises');
const fse = require('fs-extra');
const path = require('path');
const { Gitlab } = require('@gitbeaker/node');

const initSettings = require('../../settings.js');

const handler = async ({
  program, groupId, id, token,
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

  data.id = id;
  data.token = token;
  // _.set(data.programs, ['programs', program], group);
  if (!data.programs) {
    data.programs = {};
  }
  data.programs[program] = groupId;

  await fse.writeJson(hexletConfigPath, data);
  console.log(`Config created: ${hexletConfigPath}`);

  const api = new Gitlab({
    token,
  });

  const namespace = await api.Namespaces.show(groupId);
  const projectId = path.join(namespace.full_path, `${id}`);
  let project;
  try {
    project = await api.Projects.create({
      name: id,
      namespace_id: groupId,
    });
  } catch (e) {
    project = await api.Projects.show(projectId);
  }
  console.log(`Repository Home: ${project.web_url}`);

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
  const localPath = path.join(hexletDir, program, namespace.path);
  console.log(`COMMAND: git clone ${project.ssh_url_to_repo} ${localPath}`);

  return { hexletConfigPath };
};

const obj = {
  command: 'init <program> <groupId> <id>',
  description: 'Init repository',
  builder: (yargs) => yargs.option('token', {
    description: 'Gitlab Token',
    required: true,
    type: 'string',
  }),
  handler,
};

module.exports = obj;
