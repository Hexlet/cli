const readdirp = require('readdirp');

const getFileType = (fileStats) => {
  if (fileStats.isDirectory()) {
    return 'directory';
  }
  if (fileStats.isFile()) {
    return 'file';
  }
  if (fileStats.isSymbolicLink()) {
    return 'symlink';
  }
  return 'other';
};

const readDirP = async (dirPath) => {
  const filesInfo = await readdirp.promise(
    dirPath,
    { alwaysStat: true },
  );

  return filesInfo.map((fileInfo) => ({
    path: fileInfo.path,
    name: fileInfo.basename,
    size: fileInfo.stats.size,
    type: getFileType(fileInfo.stats),
  }));
};

module.exports = {
  readDirP,
};
