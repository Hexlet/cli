// @ts-check

const fsp = require('fs/promises');
const fse = require('fs-extra');
const os = require('os');
const util = require('util');
const chalk = require('chalk');
const path = require('path');
const tar = require('tar');
const axios = require('axios');
const debug = require('debug');

const log = debug('hexlet');

const initSettings = require('../../settings.js');
const { readHexletConfig } = require('../../utils.js');

const handler = async ({
  program, exercise,
}, customSettings = {}) => {
  const {
    generateHexletProgramPath, hexletConfigPath,
  } = initSettings(customSettings);

  // TODO: check that program initialized
  await readHexletConfig(hexletConfigPath);

  const templateUrl = 'https://hexlet-programs.fra1.digitaloceanspaces.com/%s-program.tar.gz';
  const programUrl = util.format(templateUrl, program);
  log(programUrl);
  const tmpDirPath = path.join(os.tmpdir(), `${program}-program`);
  log(tmpDirPath);
  const tmpArchiveFilePath = `${tmpDirPath}.tar.gz`;
  log(tmpArchiveFilePath);

  const response = await axios({
    method: 'get',
    url: programUrl,
    responseType: 'arraybuffer',
  });
  await fsp.writeFile(tmpArchiveFilePath, response.data);

  // TODO: use mkdtemp
  await fse.remove(tmpDirPath);
  await fsp.mkdir(tmpDirPath);
  await tar.x({
    cwd: tmpDirPath,
    file: tmpArchiveFilePath,
    noChmod: true,
  });

  const hexletProgramPath = generateHexletProgramPath(program);
  const programPathExists = await fse.pathExists(hexletProgramPath);
  if (!programPathExists) {
    await fse.mkdirp(hexletProgramPath);
  }

  const filesToCopy = [
    '.gitignore',
  ];

  const promises = filesToCopy.map((fileName) => {
    const tmpFilePath = path.join(tmpDirPath, fileName);
    const hexletFilePath = path.join(hexletProgramPath, fileName);
    return fse.copy(tmpFilePath, hexletFilePath);
  });

  await Promise.all(promises);

  const exercisesPath = path.join(tmpDirPath, 'exercises');
  // const exerciseNames = await fsp.readdir(exercisesPath);

  // const promises = exerciseNames.map(async (exerciseName) => {
  //   const hexletExercisePath = path.join(programPath, 'exercises', exerciseName);
  //   const exercisePath = path.join(exercisesPath, exerciseName);
  //   const exists = await fse.pathExists(hexletExercisePath);
  //   if (!exists) {
  //     await fse.copy(exercisePath, hexletExercisePath);
  //   }
  // });
  // Promise.all(promises);
  const hexletExercisePath = path.join(hexletProgramPath, 'exercises', exercise);
  const exercisePath = path.join(exercisesPath, exercise);
  try {
    await fse.copy(exercisePath, hexletExercisePath);
  } catch (e) {
    log(e);
    throw new Error(`Program "${program}" does not contain exercise with name "${exercise}"`);
  }

  // TODO: Perhaps you need to delete the archive and temporary directory after copying.
  // So that all homework is not left locally.

  console.log(chalk.green(`Exercise path: ${hexletExercisePath}`));
};

const obj = {
  command: 'download <program> <exercise>',
  description: 'Download exercises',
  builder: () => {},
  handler,
};

module.exports = obj;
