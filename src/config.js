// @ts-check

const fse = require('fs-extra');
const fsp = require('fs/promises');
const chalk = require('chalk');
const path = require('path');
const os = require('os');

const { getValidator } = require('./validator/index.js');

const readHexletConfig = async (configPath, entityName) => {
  try {
    await fsp.access(configPath);
  } catch (e) {
    console.log(chalk.yellow(`Config '${configPath}' does not exists. Try to run 'init' command`));
    throw e;
  }

  const configData = await fse.readJson(configPath);
  // NOTE: решение проблемы с обратной совместимостью
  if (!configData.hexletDir) {
    configData.hexletDir = path.join(os.homedir(), 'Hexlet');
  }

  const validate = getValidator(entityName);
  if (!validate(configData)) {
    const errorDetail = JSON.stringify(validate.errors, null, 2);
    throw new Error(chalk.red(`Validation error "${configPath}"\n${errorDetail}`));
  }

  return configData;
};

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

const initSettings = (options = {}) => {
  const cwdPath = options.cwdPath || process.cwd();
  const homeDir = options.homedir || os.homedir();
  const hexletConfigDir = path.join(homeDir, 'Hexlet');
  const cliSrcDir = path.join(__dirname, '..', 'src');
  const hexletConfigPath = path.join(hexletConfigDir, '.config.json');
  const hexletTemplatesPath = path.join(cliSrcDir, 'templates');
  const branch = 'main';
  const author = {
    name: '@hexlet/cli',
    email: 'support@hexlet.io',
  };
  const repo = {
    name: 'hexlet-assignments',
    description: 'Hexlet assignments',
  };
  const generateRepoPath = (hexletDir) => path.join(hexletDir, repo.name);
  // NOTE: данные ниже, нужны только для программ
  const generateHexletProgramPath = (hexletDir, programSlug) => path.join(hexletDir, programSlug);

  return {
    cwdPath,
    author,
    hexletConfigDir,
    hexletConfigPath,
    branch,
    hexletTemplatesPath,
    repo,
    generateHexletProgramPath,
    generateRepoPath,
  };
};

module.exports = {
  readHexletConfig,
  initSettings,
  prepareConfig,
};
