// @ts-check

// const fsp = require('fs/promises');
const fse = require('fs-extra');
const fs = require('fs');
const os = require('os');
const util = require('util');
const path = require('path');
const tar = require('tar');
const axios = require('axios');
const debug = require('debug');
const { Gitlab } = require('@gitbeaker/node');

const log = debug('hexlet');

const initSettings = require('../../settings.js');

const handler = async ({
  program
}, customSettings = {}) => {
  const {
    branch, hexletConfigPath, hexletDir, hexletTemplatesPath,
  } = initSettings(customSettings);

  const { token } = await fse.readJson(hexletConfigPath);
  const api = new Gitlab({
    token,
  });

  const templateUrl = 'https://my-data.fra1.digitaloceanspaces.com/hexlet-programs/%s-program.tar.gz';
  const programUrl = util.format(templateUrl, program);
  log(programUrl);
  const tmpFilePath = path.join(os.tmpdir(), `${program}-program.tar.gz`);
  log(tmpFilePath);
  // const tmpDirPath

  await axios({
    method: 'get',
    url: programUrl,
    responseType: 'stream',
  }).then((response) => response.data.pipe(fs.createWriteStream(tmpFilePath)));

  const result = await tar.x({
    file: tmpFilePath,
  }); // .then(_=> { .. tarball has been dumped in cwd .. })
  // console.log(result);
};

const obj = {
  command: 'submit <program>',
  description: 'Submit exercises',
  builder: () => {},
  handler,
};

module.exports = obj;
