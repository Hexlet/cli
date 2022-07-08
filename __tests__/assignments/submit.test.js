// @ts-check

const os = require('os');
const path = require('path');
const fsp = require('fs/promises');
const fse = require('fs-extra');
const nock = require('nock');

const command = require('../../src/commands/assignment/submit.js');
const { initSettings } = require('../../src/config.js');
const { readFile, getAssignmentConfig } = require('../helpers/index.js');
const git = require('../../src/utils/git.js');
const workDirStates = require('../../__fixtures__/assignmentsWorkDirStates.js');

const mockServerHost = 'localhost:8888';
const baseUrl = `http://${mockServerHost}`;

const args = {
  _: ['assignment', 'submit'],
};
const author = { name: 'user', email: 'user@example.com' };
const submittedAssignmentRelativePath = path.join('basics-course', 'example');

const anotherFilePath = path.join('basics-course', 'example', 'anotherFile');
const someFilePath = path.join('basics-course', 'example', 'someFile');
const file1Path = path.join('basics-course', 'example', 'file1');
const file2Path = path.join('basics-course', 'example', 'subdir', 'file2');
const file3Path = path.join('basics-course', 'example', 'file3');
const file4Path = path.join('basics-course', 'example', 'subdir', 'file4');
const file5Path = path.join('basics-course', 'example', 'subdir', 'file5');
const file6Path = path.join('basics-course', 'example', 'file6');
const gitignorePath = path.join('basics-course', 'example', '.gitignore');
const readmePath = path.join('basics-course', 'example', 'README.md');
const makefilePath = path.join('basics-course', 'example', 'Makefile');
const readmeStartPath = path.join('basics-course', 'start', 'README.md');
const makefileStartPath = path.join('basics-course', 'start', 'Makefile');
const currentPath = '.current.json';

const makeLocalChanges = async (assignmentsPath) => {
  // modified existing files
  await fse.outputFile(path.join(assignmentsPath, file1Path), 'local content');
  await fse.outputFile(path.join(assignmentsPath, file2Path), 'local content');
  await git.add({ filepath: 'basics-course/example/subdir/file2', dir: assignmentsPath });
  await fse.outputFile(path.join(assignmentsPath, readmeStartPath), 'local content');
  await git.add({ filepath: 'basics-course/start/README.md', dir: assignmentsPath });
  await fse.outputFile(path.join(assignmentsPath, readmeStartPath), 'local changed content');
  // create new files
  await fse.outputFile(path.join(assignmentsPath, file3Path), 'local content');
  await fse.outputFile(path.join(assignmentsPath, file4Path), 'local content');
  await git.add({ filepath: 'basics-course/example/subdir/file4', dir: assignmentsPath });
  await fse.outputFile(path.join(assignmentsPath, file5Path), 'local content');
  await git.add({ filepath: 'basics-course/example/subdir/file5', dir: assignmentsPath });
  await fse.outputFile(path.join(assignmentsPath, file5Path), 'local changed content');
  await fse.outputFile(path.join(assignmentsPath, file6Path), 'local content');
  await git.add({ filepath: 'basics-course/example/file6', dir: assignmentsPath });
  await fse.remove(path.join(assignmentsPath, file6Path));
  // remove file and remove file from index
  await git.remove({ filepath: '.github/workflows/hexlet-check.yml', dir: assignmentsPath });
  await fse.remove(path.join(assignmentsPath, currentPath));
  await fse.remove(path.join(assignmentsPath, gitignorePath));
  await fse.remove(path.join(assignmentsPath, readmePath));
  // remove file and then changed (same as change and then delete) => modified
  await git.remove({ filepath: 'basics-course/start/Makefile', dir: assignmentsPath });
  await fse.outputFile(path.join(assignmentsPath, makefileStartPath), 'local new content');
  await git.remove({ filepath: 'basics-course/example/Makefile', dir: assignmentsPath });
  await fse.outputFile(path.join(assignmentsPath, makefilePath), 'local new content');
};

describe('assignment submit', () => {
  let assignmentsPath;
  let hexletConfigPath;
  let customOptions;
  let hexletDir;

  beforeAll(() => {
    nock.disableNetConnect();
    nock.enableNetConnect(new RegExp(mockServerHost));
  });

  afterAll(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  beforeEach(async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'hexlet-cli-'));
    const customSettings = { homedir: tmpDir };
    const settings = initSettings(customSettings);
    hexletConfigPath = settings.hexletConfigPath;
    await fse.ensureDir(settings.hexletConfigDir);
    hexletDir = path.join(tmpDir, 'learning', 'Hexlet');
    assignmentsPath = settings.generateRepoPath(hexletDir);
    const cwdPath = path.join(assignmentsPath, submittedAssignmentRelativePath);
    customOptions = { ...customSettings, cwdPath };
  });

  it('no local changes, remote repo has new assignments', async () => {
    const cloneUrl = `${baseUrl}/assignments-10.git`;
    const remoteUrl = `${baseUrl}/assignments-20.git`;

    const config = getAssignmentConfig({ hexletDir, remoteUrl });
    await fse.writeJson(hexletConfigPath, config);

    await git.clone({ dir: assignmentsPath, url: cloneUrl });
    await git.remoteSetUrl({ dir: assignmentsPath, url: remoteUrl });
    expect(await git.lsFiles({ dir: assignmentsPath }))
      .toEqual(workDirStates.repo10);

    const actualCommits1 = await git.logMessages({ dir: assignmentsPath });
    const expectedCommits1 = [
      'init',
    ];
    expect(actualCommits1).toEqual(expectedCommits1);

    await command.handler(args, customOptions);
    expect(await git.lsFiles({ dir: assignmentsPath }))
      .toEqual(workDirStates.repo20);

    const actualCommits2 = await git.logMessages({ dir: assignmentsPath });
    const expectedCommits2 = [
      'submit basics-course/example',
      'download basics-course/start',
      'add basics-course/example',
      'init',
    ];
    expect(actualCommits2).toEqual(expectedCommits2);
  });

  it('no local changes, remote repo has new file & changed file', async () => {
    const cloneUrl = `${baseUrl}/assignments-20.git`;
    const remoteUrl = `${baseUrl}/assignments-30.git`;

    const config = getAssignmentConfig({ hexletDir, remoteUrl });
    await fse.writeJson(hexletConfigPath, config);

    await git.clone({ dir: assignmentsPath, url: cloneUrl });
    await git.remoteSetUrl({ dir: assignmentsPath, url: remoteUrl });
    expect(await git.lsFiles({ dir: assignmentsPath }))
      .toEqual(workDirStates.repo20);

    const actualCommits1 = await git.logMessages({ dir: assignmentsPath });
    const expectedCommits1 = [
      'submit basics-course/example',
      'download basics-course/start',
      'add basics-course/example',
      'init',
    ];
    expect(actualCommits1).toEqual(expectedCommits1);

    expect(await readFile(path.join(assignmentsPath, file1Path)))
      .toEqual('init content');

    // NOTE: проверка submit из поддиректорий домашнего задания
    const cwdPath = path.join(customOptions.cwdPath, 'subdir');
    await command.handler(args, { ...customOptions, cwdPath });
    expect(await git.lsFiles({ dir: assignmentsPath }))
      .toEqual(workDirStates.repo30);

    const actualCommits2 = await git.logMessages({ dir: assignmentsPath });
    const expectedCommits2 = [
      'add file2 & change file1',
      'submit basics-course/example',
      'download basics-course/start',
      'add basics-course/example',
      'init',
    ];
    expect(actualCommits2).toEqual(expectedCommits2);

    expect(await readFile(path.join(assignmentsPath, file1Path)))
      .toEqual('changed content');
    expect(await readFile(path.join(assignmentsPath, file2Path)))
      .toEqual('init content');
  });

  it('local repo has changes, remote repo has no changes', async () => {
    const cloneUrl = `${baseUrl}/assignments-30.git`;

    const config = getAssignmentConfig({ hexletDir, remoteUrl: cloneUrl });
    await fse.writeJson(hexletConfigPath, config);

    await git.clone({ dir: assignmentsPath, url: cloneUrl });
    expect(await git.lsFiles({ dir: assignmentsPath }))
      .toEqual(workDirStates.repo30);

    const actualCommits1 = await git.logMessages({ dir: assignmentsPath });
    const expectedCommits1 = [
      'add file2 & change file1',
      'submit basics-course/example',
      'download basics-course/start',
      'add basics-course/example',
      'init',
    ];
    expect(actualCommits1).toEqual(expectedCommits1);

    await makeLocalChanges(assignmentsPath);
    expect(await git.lsFiles({ dir: assignmentsPath }))
      .toEqual(workDirStates.repo30changed);

    await command.handler(args, customOptions);
    expect(await git.lsFiles({ dir: assignmentsPath }))
      .toEqual(workDirStates.repo30afterPull30);

    const actualCommits2 = await git.logMessages({ dir: assignmentsPath });
    const expectedCommits2 = [
      'submit basics-course/example',
      'add file2 & change file1',
      'submit basics-course/example',
      'download basics-course/start',
      'add basics-course/example',
      'init',
    ];
    expect(actualCommits2).toEqual(expectedCommits2);

    expect(await readFile(path.join(assignmentsPath, file1Path)))
      .toEqual('local content');
    expect(await readFile(path.join(assignmentsPath, file2Path)))
      .toEqual('local content');
    expect(await readFile(path.join(assignmentsPath, readmeStartPath)))
      .toEqual('local changed content');
    expect(await readFile(path.join(assignmentsPath, file3Path)))
      .toEqual('local content');
    expect(await readFile(path.join(assignmentsPath, file4Path)))
      .toEqual('local content');
    expect(await readFile(path.join(assignmentsPath, file5Path)))
      .toEqual('local changed content');
    expect(await readFile(path.join(assignmentsPath, makefilePath)))
      .toEqual('local new content');
    expect(await readFile(path.join(assignmentsPath, makefileStartPath)))
      .toEqual('local new content');
  });

  it('local repo has changes, remote repo has commit with conflicts', async () => {
    const cloneUrl = `${baseUrl}/assignments-30.git`;
    const remoteUrl = `${baseUrl}/assignments-40.git`;

    const config = getAssignmentConfig({ hexletDir, remoteUrl });
    await fse.writeJson(hexletConfigPath, config);

    await git.clone({ dir: assignmentsPath, url: cloneUrl });
    await git.remoteSetUrl({ dir: assignmentsPath, url: remoteUrl });
    expect(await git.lsFiles({ dir: assignmentsPath }))
      .toEqual(workDirStates.repo30);

    const actualCommits1 = await git.logMessages({ dir: assignmentsPath });
    const expectedCommits1 = [
      'add file2 & change file1',
      'submit basics-course/example',
      'download basics-course/start',
      'add basics-course/example',
      'init',
    ];
    expect(actualCommits1).toEqual(expectedCommits1);

    await makeLocalChanges(assignmentsPath);
    expect(await git.lsFiles({ dir: assignmentsPath }))
      .toEqual(workDirStates.repo30changed);

    await command.handler(args, customOptions);
    expect(await git.lsFiles({ dir: assignmentsPath }))
      .toEqual(workDirStates.repo30afterPull40);

    const actualCommits2 = await git.logMessages({ dir: assignmentsPath });
    // NOTE: коммит с конфликтами вмерджен до локальных изменений, как и планировалось
    const expectedCommits2 = [
      'submit basics-course/example',
      'change file1, file2 & add file3 & remove .gitignore',
      'add file2 & change file1',
      'submit basics-course/example',
      'download basics-course/start',
      'add basics-course/example',
      'init',
    ];
    expect(actualCommits2).toEqual(expectedCommits2);

    expect(await readFile(path.join(assignmentsPath, file1Path)))
      .toEqual('local content');
    expect(await readFile(path.join(assignmentsPath, file2Path)))
      .toEqual('local content');
    expect(await readFile(path.join(assignmentsPath, readmeStartPath)))
      .toEqual('local changed content');
    expect(await readFile(path.join(assignmentsPath, file3Path)))
      .toEqual('local content');
    expect(await readFile(path.join(assignmentsPath, file4Path)))
      .toEqual('local content');
    expect(await readFile(path.join(assignmentsPath, file5Path)))
      .toEqual('local changed content');
    expect(await readFile(path.join(assignmentsPath, makefilePath)))
      .toEqual('local new content');
    expect(await readFile(path.join(assignmentsPath, makefileStartPath)))
      .toEqual('local new content');
  });

  it('local repo has changes with commit, remote repo has commit without conflicts', async () => {
    const cloneUrl = `${baseUrl}/assignments-30.git`;
    const remoteUrl = `${baseUrl}/assignments-50.git`;

    const config = getAssignmentConfig({ hexletDir, remoteUrl });
    await fse.writeJson(hexletConfigPath, config);

    await git.clone({ dir: assignmentsPath, url: cloneUrl });
    await git.remoteSetUrl({ dir: assignmentsPath, url: remoteUrl });
    expect(await git.lsFiles({ dir: assignmentsPath }))
      .toEqual(workDirStates.repo30);

    const actualCommits1 = await git.logMessages({ dir: assignmentsPath });
    const expectedCommits1 = [
      'add file2 & change file1',
      'submit basics-course/example',
      'download basics-course/start',
      'add basics-course/example',
      'init',
    ];
    expect(actualCommits1).toEqual(expectedCommits1);

    await makeLocalChanges(assignmentsPath);
    expect(await git.lsFiles({ dir: assignmentsPath }))
      .toEqual(workDirStates.repo30changed);
    await git.add({ dir: assignmentsPath, filepath: 'basics-course/example' });
    await git.add({ dir: assignmentsPath, filepath: '.current.json' });
    await git.add({ dir: assignmentsPath, filepath: '.github/workflows/hexlet-check.yml' });
    await git.commit({ message: 'local commit', author, dir: assignmentsPath });
    expect(await git.lsFiles({ dir: assignmentsPath }))
      .toEqual(workDirStates.repo30changedAllCommitted);

    await command.handler(args, customOptions);
    expect(await git.lsFiles({ dir: assignmentsPath }))
      .toEqual(workDirStates.repo30afterPull50);

    const actualCommits2 = await git.logMessages({ dir: assignmentsPath });
    // NOTE: выполнен мердж, конфликтов нет.
    const expectedCommits2 = [
      'submit basics-course/example',
      "Merge branch 'main' of http://localhost:8888/assignments-50.git",
      'local commit',
      'add anotherFile, change someFile, add new assignment',
      'add someFile',
      'add file2 & change file1',
      'submit basics-course/example',
      'download basics-course/start',
      'add basics-course/example',
      'init',
    ];
    expect(actualCommits2).toEqual(expectedCommits2);

    expect(await readFile(path.join(assignmentsPath, file1Path)))
      .toEqual('local content');
    expect(await readFile(path.join(assignmentsPath, file2Path)))
      .toEqual('local content');
    expect(await readFile(path.join(assignmentsPath, readmeStartPath)))
      .toEqual('local changed content');
    expect(await readFile(path.join(assignmentsPath, file3Path)))
      .toEqual('local content');
    expect(await readFile(path.join(assignmentsPath, file4Path)))
      .toEqual('local content');
    expect(await readFile(path.join(assignmentsPath, file5Path)))
      .toEqual('local changed content');
    expect(await readFile(path.join(assignmentsPath, makefilePath)))
      .toEqual('local new content');
    expect(await readFile(path.join(assignmentsPath, makefileStartPath)))
      .toEqual('local new content');
    expect(await readFile(path.join(assignmentsPath, anotherFilePath)))
      .toEqual('remote content');
    expect(await readFile(path.join(assignmentsPath, someFilePath)))
      .toEqual('remote content');
  });

  // NOTE: локально выполнен вручную коммит, но не запушен в удалённый репозиторий).
  // Удалённый репозиторий содержит коммит с конфликтами (он локально отсутствует),
  // Submit провален, нужно делать pull и исправлять конфликты вручную!
  it('local repo has changes with commit, remote repo has commit with conflicts', async () => {
    const cloneUrl = `${baseUrl}/assignments-30.git`;
    const remoteUrl = `${baseUrl}/assignments-40.git`;

    const config = getAssignmentConfig({ hexletDir, remoteUrl });
    await fse.writeJson(hexletConfigPath, config);

    await git.clone({ dir: assignmentsPath, url: cloneUrl });
    await git.remoteSetUrl({ dir: assignmentsPath, url: remoteUrl });
    expect(await git.lsFiles({ dir: assignmentsPath }))
      .toEqual(workDirStates.repo30);

    const actualCommits1 = await git.logMessages({ dir: assignmentsPath });
    const expectedCommits1 = [
      'add file2 & change file1',
      'submit basics-course/example',
      'download basics-course/start',
      'add basics-course/example',
      'init',
    ];
    expect(actualCommits1).toEqual(expectedCommits1);

    await makeLocalChanges(assignmentsPath);
    expect(await git.lsFiles({ dir: assignmentsPath }))
      .toEqual(workDirStates.repo30changed);
    await git.add({ dir: assignmentsPath, filepath: 'basics-course/example' });
    await git.add({ dir: assignmentsPath, filepath: '.current.json' });
    await git.add({ dir: assignmentsPath, filepath: '.github/workflows/hexlet-check.yml' });
    await git.commit({ message: 'local commit', author, dir: assignmentsPath });
    expect(await git.lsFiles({ dir: assignmentsPath }))
      .toEqual(workDirStates.repo30changedAllCommitted);

    await expect(command.handler(args, customOptions))
      .rejects.toThrow(git.Errors.MergeNotSupportedError);
    expect(await git.lsFiles({ dir: assignmentsPath }))
      .toEqual(workDirStates.repo30afterPull40Conflicts);

    const actualCommits2 = await git.logMessages({ dir: assignmentsPath });
    const expectedCommits2 = [
      'local commit',
      'add file2 & change file1',
      'submit basics-course/example',
      'download basics-course/start',
      'add basics-course/example',
      'init',
    ];
    expect(actualCommits2).toEqual(expectedCommits2);

    expect(await readFile(path.join(assignmentsPath, file1Path)))
      .toEqual('local content');
    expect(await readFile(path.join(assignmentsPath, file2Path)))
      .toEqual('local content');
    expect(await readFile(path.join(assignmentsPath, readmeStartPath)))
      .toEqual('local changed content');
    expect(await readFile(path.join(assignmentsPath, file3Path)))
      .toEqual('local content');
    expect(await readFile(path.join(assignmentsPath, file4Path)))
      .toEqual('local content');
    expect(await readFile(path.join(assignmentsPath, file5Path)))
      .toEqual('local changed content');
    expect(await readFile(path.join(assignmentsPath, makefilePath)))
      .toEqual('local new content');
    expect(await readFile(path.join(assignmentsPath, makefileStartPath)))
      .toEqual('local new content');
  });

  it('remote repository is ahead of the local one by 1 commit (deleted some files)', async () => {
    const cloneUrl = `${baseUrl}/assignments-30.git`;
    const remoteUrl = `${baseUrl}/assignments-60.git`;

    const config = getAssignmentConfig({ hexletDir, remoteUrl });
    await fse.writeJson(hexletConfigPath, config);

    await git.clone({ dir: assignmentsPath, url: cloneUrl });
    await git.remoteSetUrl({ dir: assignmentsPath, url: remoteUrl });
    expect(await git.lsFiles({ dir: assignmentsPath }))
      .toEqual(workDirStates.repo30);

    const actualCommits1 = await git.logMessages({ dir: assignmentsPath });
    const expectedCommits1 = [
      'add file2 & change file1',
      'submit basics-course/example',
      'download basics-course/start',
      'add basics-course/example',
      'init',
    ];
    expect(actualCommits1).toEqual(expectedCommits1);

    await command.handler(args, customOptions);
    expect(await git.lsFiles({ dir: assignmentsPath }))
      .toEqual(workDirStates.repo30afterPull60);

    const actualCommits2 = await git.logMessages({ dir: assignmentsPath });
    const expectedCommits2 = [
      'remove file1',
      'add file2 & change file1',
      'submit basics-course/example',
      'download basics-course/start',
      'add basics-course/example',
      'init',
    ];
    expect(actualCommits2).toEqual(expectedCommits2);
  });

  it('submit from wrong directories', async () => {
    const cloneUrl = `${baseUrl}/assignments-30.git`;

    const config = getAssignmentConfig({ hexletDir, remoteUrl: cloneUrl });
    await fse.writeJson(hexletConfigPath, config);

    await git.clone({ dir: assignmentsPath, url: cloneUrl });
    await makeLocalChanges(assignmentsPath);

    let cwdPath = path.join(assignmentsPath, 'basics-course');
    await expect(command.handler(args, { ...customOptions, cwdPath }))
      .rejects.toThrow('Submit command must be executed from assignment directory.');

    cwdPath = os.homedir();
    await expect(command.handler(args, { ...customOptions, cwdPath }))
      .rejects.toThrow('Submit command must be executed from assignment directory.');
  });
});
