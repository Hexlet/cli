// @ts-check

const os = require('os');
const path = require('path');
const fsp = require('fs/promises');
const fse = require('fs-extra');
const nock = require('nock');

const assignmentDownloadCmd = require('../../src/commands/assignment/download.js');
const assignmentRefreshCmd = require('../../src/commands/assignment/refresh.js');
const { initSettings } = require('../../src/config.js');
const { readDirP, getFixturePath, getAssignmentConfig } = require('../helpers/index.js');

const buildLessonUrl = (courseSlug, lessonSlug) => (
  `https://ru.hexlet.io/courses/${courseSlug}/lessons/${lessonSlug}/theory_unit`
);
const buildApiUrl = (courseSlug, lessonSlug) => (
  `https://ru.hexlet.io/api/course/${courseSlug}/lesson/${lessonSlug}/assignment/download`
);

const hexletToken = 'some-hexlet-token';
const courseSlug = 'java-advanced';
const courseSlugWithLocale = 'java-advanced-ru';
const lessonSlug = 'multithreading-java';
const commandParts = ['assignment', 'download'];
const lessonUrl = buildLessonUrl(courseSlug, lessonSlug);
const args = {
  lessonUrl, _: commandParts,
};
const lessonArchivePath = getFixturePath(`${lessonSlug}.tar.gz`);

describe.each([
  { method: 'POST', successCode: 201, command: assignmentDownloadCmd },
  { method: 'PUT', successCode: 200, command: assignmentRefreshCmd },
])('$command.description', ({ method, successCode, command }) => {
  let hexletConfigPath;
  let customSettings;
  let hexletDir;
  let config;
  let assignmentsPath;

  beforeAll(() => {
    nock.disableNetConnect();

    const scope = nock(buildApiUrl(courseSlug, lessonSlug)).persist();
    scope
      .matchHeader('X-Auth-Key', hexletToken)
      .intercept('', method)
      .replyWithFile(successCode, lessonArchivePath);
  });

  afterAll(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  beforeEach(async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'hexlet-cli-'));
    customSettings = { homedir: tmpDir };
    const settings = initSettings(customSettings);
    hexletConfigPath = settings.hexletConfigPath;
    await fse.ensureDir(settings.hexletConfigDir);
    hexletDir = path.join(tmpDir, 'learning', 'Hexlet');
    config = getAssignmentConfig({ hexletDir });
    assignmentsPath = settings.generateRepoPath(hexletDir);
  });

  it('download', async () => {
    await fse.writeJson(hexletConfigPath, config);

    await command.handler(args, customSettings);
    expect(await readDirP(hexletDir)).toMatchSnapshot();
  });

  it('download the same assignment again (with backup)', async () => {
    await fse.writeJson(hexletConfigPath, config);
    const coursePath = path.join(assignmentsPath, courseSlugWithLocale);
    const assignmentPath = path.join(coursePath, lessonSlug);
    const someFilePath = path.join(assignmentPath, 'SomeFile.java');
    await fse.outputFile(someFilePath, 'content');

    expect(await readDirP(assignmentPath)).toMatchSnapshot();
    await command.handler(args, customSettings);
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
    await expect(command.handler(args, customSettings))
      .rejects.toThrow('no such file or directory');
  });

  it('download with invalid .config.json', async () => {
    await fse.writeJson(hexletConfigPath, {});

    await expect(command.handler(args, customSettings))
      .rejects.toThrow(`Validation error "${hexletConfigPath}"`);
  });

  it('download with incorrect lessonUrl', async () => {
    await fse.writeJson(hexletConfigPath, config);
    const params = {
      ...args,
      lessonUrl: 'https://domain.com',
    };

    await expect(command.handler(params, customSettings))
      .rejects.toThrow('Incorrect lessonUrl');
  });

  it('download with negative api responses', async () => {
    await fse.writeJson(hexletConfigPath, config);
    const wrongCourseSlug = 'wrong-course';
    const wrongLessonSlug = 'wrong-lesson';
    const params = {
      ...args,
      lessonUrl: buildLessonUrl(wrongCourseSlug, wrongLessonSlug),
    };

    nock(buildApiUrl(wrongCourseSlug, wrongLessonSlug))
      .intercept('', method)
      .reply(404);
    await expect(command.handler(params, customSettings))
      .rejects.toThrow(`Assignment ${wrongCourseSlug}/${wrongLessonSlug} not found. Check the lessonUrl.`);

    let message = 'Invalid token passed.';
    nock(buildApiUrl(wrongCourseSlug, wrongLessonSlug))
      .intercept('', method)
      .reply(401, { message });
    await expect(command.handler(params, customSettings))
      .rejects.toThrow(message);

    message = 'You do not have permission to download assignment.';
    nock(buildApiUrl(wrongCourseSlug, wrongLessonSlug))
      .intercept('', method)
      .reply(422, { message });
    await expect(command.handler(params, customSettings))
      .rejects.toThrow(message);

    // Unhandled errors
    nock(buildApiUrl(wrongCourseSlug, wrongLessonSlug))
      .intercept('', method)
      .reply(500);
    await expect(command.handler(params, customSettings))
      .rejects.toThrow('Request failed with status code 500');
  });
});
