// @ts-check

const fsp = require('fs/promises');
const fse = require('fs-extra');
const os = require('os');
const chalk = require('chalk');
const path = require('path');
const tar = require('tar');
const debug = require('debug');

const log = debug('hexlet');

const { initSettings, readHexletConfig } = require('../../config.js');
const { getEntityName, updateTemplates } = require('../../utils/index.js');
const { getLessonData, backupAssignment } = require('../../utils/assignments.js');
const { downloadAssignment } = require('../../utils/hexlet.js');

module.exports = async (params, customSettings = {}) => {
  const { lessonUrl } = params;
  const entityName = getEntityName(params);

  const {
    generateRepoPath, hexletConfigPath, hexletTemplatesPath,
  } = initSettings(customSettings);

  const { hexletDir, hexletToken } = await readHexletConfig(hexletConfigPath, entityName);
  const { apiHost, courseSlug, lessonSlug } = getLessonData(lessonUrl);

  const repoPath = generateRepoPath(hexletDir);
  const assignmentPath = path.join(repoPath, courseSlug, lessonSlug);

  const tmpDirPath = await fsp.mkdtemp(path.join(os.tmpdir(), 'hexlet-assignments-'));
  const tmpArchiveName = `${lessonSlug}.tar.gz`;
  const tmpArchivePath = path.join(tmpDirPath, tmpArchiveName);

  await downloadAssignment({
    apiHost,
    courseSlug,
    lessonSlug,
    filePath: tmpArchivePath,
    hexletToken,
  });

  log('prepare directory', assignmentPath);
  const assignmentPathExists = await fse.pathExists(assignmentPath);
  if (assignmentPathExists) {
    const assignmentBackupPath = await backupAssignment(assignmentPath);
    console.log(chalk.gray(`The existing assignment has been moved to the ${assignmentBackupPath}`));
  }
  await fse.ensureDir(assignmentPath);

  log('extract archive', tmpArchivePath);
  await tar.x({
    cwd: assignmentPath,
    file: tmpArchivePath,
    noChmod: true,
  });

  await updateTemplates(hexletTemplatesPath, repoPath);

  console.log(chalk.green(`Assignment path: ${assignmentPath}`));
};
