const chalk = require('chalk');
const fse = require('fs-extra');
const fsp = require('fs/promises');

module.exports.readHexletConfig = async (configPath) => {
  try {
    await fsp.access(configPath);
  } catch (e) {
    console.log(chalk.yellow(`Config '${configPath}' does not exists. Try to run 'init' command`));
    throw e;
  }
  // TODO: add schema check https://github.com/ajv-validator/ajv
  return fse.readJson(configPath);
};

module.exports.isRoot = () => process.getuid && process.getuid() === 0;
