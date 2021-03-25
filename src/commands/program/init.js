// @ts-check

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const { Gitlab } = require('@gitbeaker/node');

const { branch, hexletConfigPath, hexletDir, cliSrcDir } = require('../../settings.js');

const handler = async ({
  program, groupId, id, token,
}) => {
  let data = {};

  fse.ensureDir(path.dirname(hexletConfigPath));
  try {
    if (fs.existsSync(hexletConfigPath)) {
      data = fse.readJsonSync(hexletConfigPath);
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

  fse.writeJsonSync(hexletConfigPath, data);
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

  const gitlabCiYamlContent = fs.readFileSync(path.join(cliSrcDir, 'templates/gitlab-ci.yml'), 'utf-8');
  const gitlabCiFilePath = '.gitlab-ci.yml';

  try {
    await api.Commits.create(
      projectId,
      branch,
      'init',
      [
        {
          action: 'create',
          filePath: gitlabCiFilePath,
          content: gitlabCiYamlContent,
        },
      ],
    );
  } catch (e) {
    await api.Commits.create(
      projectId,
      branch,
      'init (refresh)',
      [
        {
          action: 'update',
          filePath: gitlabCiFilePath,
          content: gitlabCiYamlContent,
        },
      ],
    );
  }

  // console.log(namespace);
  const localPath = path.join(hexletDir, program, namespace.path);
  console.log(`COMMAND: git clone ${project.ssh_url_to_repo} ${localPath}`);
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
