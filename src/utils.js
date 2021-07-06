// @ts-check

const fse = require('fs-extra');
const fsp = require('fs/promises');
const chalk = require('chalk');
const updateNotifier = require('update-notifier');
const pkg = require('../package.json');

const { getValidator } = require('./validator.js');

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

module.exports.checkVersion = () => {
  const notifier = updateNotifier({
    pkg,
    // NOTE: notify the user every time the utility is started
    updateCheckInterval: 0,
  });
  notifier.notify({ defer: false, isGlobal: true });
};
