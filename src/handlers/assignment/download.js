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
const {
  getLessonData, makeAssignmentBackup, checkLessonUrl, generateAssignmentPath,
} = require('../../utils/assignments.js');
const { downloadAssignment } = require('../../utils/hexlet.js');

module.exports = async (params, customSettings = {}) => {
  const { lessonUrl, refresh } = params;
  const entityName = getEntityName(params);

  const {
    generateRepoPath, hexletConfigPath, hexletTemplatesPath,
  } = initSettings(customSettings);

  const { hexletDir, hexletToken } = await readHexletConfig(hexletConfigPath, entityName);

  const repoPath = generateRepoPath(hexletDir);
  checkLessonUrl(lessonUrl);
  const {
    apiHost, courseSlug, lessonSlug, locale,
  } = getLessonData(lessonUrl);
  const assignmentPath = generateAssignmentPath(repoPath, courseSlug, lessonSlug, locale);

  const tmpDirPath = await fsp.mkdtemp(path.join(os.tmpdir(), 'hexlet-assignments-'));
  const tmpArchiveName = `${lessonSlug}.tar.gz`;
  const tmpArchivePath = path.join(tmpDirPath, tmpArchiveName);

  await downloadAssignment({
    apiHost,
    courseSlug,
    lessonSlug,
    filePath: tmpArchivePath,
    hexletToken,
    refresh,
  });

  log('prepare directory', assignmentPath);
  const assignmentPathExists = await fse.pathExists(assignmentPath);
  if (assignmentPathExists) {
    const assignmentBackupPath = await makeAssignmentBackup(assignmentPath);
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
