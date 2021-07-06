// @ts-check

const util = require('util');
const path = require('path');
const axios = require('axios');
const fse = require('fs-extra');
const fsp = require('fs/promises');
const chalk = require('chalk');
const readJsonWithCb = require('read-package-json');
const semver = require('semver');

const { getValidator } = require('./validator.js');

const readJson = util.promisify(readJsonWithCb);

module.exports.readHexletConfig = async (configPath) => {
  try {
    await fsp.access(configPath);
  } catch (e) {
    console.log(chalk.yellow(`Config '${configPath}' does not exists. Try to run 'init' command`));
    throw e;
  }

  const configData = await fse.readJson(configPath);
  const validate = getValidator();
  if (!validate(configData)) {
    const errorDetail = JSON.stringify(validate.errors, null, 2);
    throw new Error(chalk.red(`Validation error "${configPath}"\n${errorDetail}`));
  }

  return configData;
};

module.exports.isRoot = () => process.getuid && process.getuid() === 0;

module.exports.checkVersion = async () => {
  // @ts-ignore
  const packageInfo = await readJson(path.join(__dirname, '..', 'package.json'));
  // @ts-ignore
  const response = await axios.get('https://registry.npmjs.org/@hexlet/cli');
  const latestVersion = response.data['dist-tags'].latest;
  if (semver.lt(packageInfo.version, latestVersion)) {
    console.log(chalk.yellow(`Current version: ${packageInfo.version}. Latest version: ${latestVersion}. Run npm i -g @hexlet/cli for installing the last one`));
  }
  console.log();
};
