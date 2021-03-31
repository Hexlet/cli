// @ts-check

const fsp = require('fs/promises');
const fse = require('fs-extra');
const os = require('os');
const util = require('util');
const path = require('path');
const tar = require('tar');
const axios = require('axios');
const debug = require('debug');

const log = debug('hexlet');

const initSettings = require('../../settings.js');

const handler = async ({
  program,
}, customSettings = {}) => {
  const {
    generateHexletProgramPath,
  } = initSettings(customSettings);

  const templateUrl = 'https://my-data.fra1.digitaloceanspaces.com/hexlet-programs/%s-program.tar.gz';
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

  await fse.remove(tmpDirPath);
  await fsp.mkdir(tmpDirPath);
  await tar.x({
    cwd: tmpDirPath,
    file: tmpArchiveFilePath,
    noChmod: true,
  });

  const programPath = generateHexletProgramPath(program);
  const programPathExists = await fse.pathExists(programPath);
  if (!programPathExists) {
    await fse.mkdirp(programPath);
  }

  const exerciseNames = await fsp.readdir(tmpDirPath);
  const promises = exerciseNames.map(async (exerciseName) => {
    const hexletExercisePath = path.join(programPath, 'exercises', exerciseName);
    const exercisePath = path.join(tmpDirPath, exerciseName);
    const exists = await fse.pathExists(hexletExercisePath);
    if (!exists) {
      await fse.copy(exercisePath, hexletExercisePath);
    }
  });
  Promise.all(promises);

  console.log(`Look at the ${programPath}`);
};

const obj = {
  command: 'download <program>',
  description: 'Download exercises',
  builder: () => {},
  handler,
};

module.exports = obj;
