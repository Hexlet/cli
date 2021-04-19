const readdirp = require('readdirp');
const path = require('path');
const _ = require('lodash');

const readDirP = async (dirPath) => {
  const filesInfo = await readdirp.promise(dirPath, {
    alwaysStat: true,
  });

  const filesData = filesInfo.map((fileInfo) => ({
    path: fileInfo.path.split(path.sep).join('/'),
    name: fileInfo.basename,
    size: BigInt(fileInfo.stats.size),
  }));

  return _.sortBy(filesData, 'path');
};

const getFixturePath = (filePath) => (
  path.join(__dirname, '..', '..', '/__fixtures__', filePath)
);

module.exports = {
  readDirP,
  getFixturePath,
};
