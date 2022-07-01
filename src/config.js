// @ts-check

const fse = require('fs-extra');
const fsp = require('fs/promises');
const chalk = require('chalk');
const path = require('path');
const os = require('os');

const { getValidator } = require('./validator.js');

const readHexletConfig = async (configPath) => {
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

  const validate = getValidator();
  if (!validate(configData)) {
    const errorDetail = JSON.stringify(validate.errors, null, 2);
    throw new Error(chalk.red(`Validation error "${configPath}"\n${errorDetail}`));
  }

  return configData;
};

const initSettings = (options = {}) => {
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
  // NOTE: данные ниже, нужны только для программ
  const generateHexletProgramPath = (hexletDir, programSlug) => path.join(hexletDir, programSlug);

  return {
    author,
    hexletConfigDir,
    hexletConfigPath,
    branch,
    hexletTemplatesPath,
    repo,
    generateHexletProgramPath,
  };
};

module.exports = {
  readHexletConfig,
  initSettings,
};
