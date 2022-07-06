// @ts-check

const os = require('os');
const path = require('path');
const fsp = require('fs/promises');
const fse = require('fs-extra');
const nock = require('nock');

const assignmentDownloadCmd = require('../../src/commands/assignment/download.js');
const { initSettings } = require('../../src/config.js');
const { readDirP, getFixturePath, getAssignmentConfig } = require('../helpers/index.js');

const buildLessonUrl = (courseSlug, lessonSlug) => (
  `https://ru.hexlet.io/courses/${courseSlug}/lessons/${lessonSlug}/theory_unit`
);

const courseSlug = 'java-advanced';
const lessonSlug = 'multithreading-java';
const commandParts = ['assignment', 'download'];
const lessonUrl = buildLessonUrl(courseSlug, lessonSlug);
const args = {
  lessonUrl, _: commandParts,
};
const lessonArchivePath = getFixturePath(`${lessonSlug}.tar.gz`);

describe('program', () => {
  let hexletConfigPath;
  let customSettings;
  let hexletDir;
  let config;
  let repoName;
  let scope;

  beforeAll(() => {
    nock.disableNetConnect();

    scope = nock(`https://ru.hexlet.io/api/course/${courseSlug}/lesson/${lessonSlug}/assignment/download`).persist();
    scope
      .post('')
      .replyWithFile(200, lessonArchivePath);
  });

  beforeEach(async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'hexlet-cli-'));
    customSettings = { homedir: tmpDir };
    const settings = initSettings(customSettings);
    hexletConfigPath = settings.hexletConfigPath;
    repoName = settings.repo.name;
    await fse.ensureDir(settings.hexletConfigDir);
    hexletDir = path.join(tmpDir, 'learning', 'Hexlet');
    config = getAssignmentConfig({ hexletDir });
  });

  it('download', async () => {
    await fse.writeJson(hexletConfigPath, config);

    await assignmentDownloadCmd.handler(args, customSettings);
    expect(await readDirP(hexletDir)).toMatchSnapshot();
  });

  it('download the same assignment again (with backup)', async () => {
    await fse.writeJson(hexletConfigPath, config);
    const coursePath = path.join(hexletDir, repoName, courseSlug);
    const assignmentPath = path.join(coursePath, lessonSlug);
    const someFilePath = path.join(assignmentPath, 'SomeFile.java');
    await fse.outputFile(someFilePath, 'content');

    expect(await readDirP(assignmentPath)).toMatchSnapshot();
    await assignmentDownloadCmd.handler(args, customSettings);
    expect(await readDirP(assignmentPath)).toMatchSnapshot();

    const assignments = await fsp.readdir(coursePath);
    const [assignment, assignmentBackup] = assignments.sort();
    expect(assignments.length).toBe(2);
    expect(assignment).toEqual('multithreading-java');
    expect(assignmentBackup).toMatch(/^multithreading-java_\d{2}\.\d{2}\.\d{2}_\d{2}\.\d{2}\.\d{2}$/);

    const assignmentBackupPath = path.join(coursePath, assignmentBackup);
    expect(await readDirP(assignmentBackupPath)).toMatchSnapshot();
  });

  it('download (without init)', async () => {
    await expect(assignmentDownloadCmd.handler(args, customSettings))
      .rejects.toThrow('no such file or directory');
  });

  it('download with invalid .config.json', async () => {
    await fse.writeJson(hexletConfigPath, {});

    await expect(assignmentDownloadCmd.handler(args, customSettings))
      .rejects.toThrow(`Validation error "${hexletConfigPath}"`);
  });

  it('download with incorrect lessonUrl', async () => {
    await fse.writeJson(hexletConfigPath, config);
    const params = {
      ...args,
      lessonUrl: 'https://domain.com',
    };

    await expect(assignmentDownloadCmd.handler(params, customSettings))
      .rejects.toThrow('Incorrect lessonUrl');
  });
});
