const chalk = require('chalk');
const fse = require('fs-extra');
const fsp = require('fs/promises');

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
