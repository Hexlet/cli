// @ts-check

const os = require('os');
const path = require('path');
const fsp = require('fs/promises');
const fse = require('fs-extra');
const nock = require('nock');

const programCmd = require('../../src/commands/program/submit.js');
const { initSettings } = require('../../src/config.js');
const { readFile, getProgramConfig } = require('../helpers/index.js');
const git = require('../../src/utils/git.js');
const workDirStates = require('../../__fixtures__/programWorkDirStates.js');

const mockServerHost = 'localhost:8888';
const baseUrl = `http://${mockServerHost}`;

const program = 'ruby';
const args = {
  program,
  _: ['program', 'submit'],
};
const author = { name: 'user', email: 'user@example.com' };

const anotherFilePath = path.join('exercises', 'example', 'anotherFile');
const file1Path = path.join('exercises', 'example', 'file1');
const file2Path = path.join('exercises', 'example', 'subdir', 'file2');
const file3Path = path.join('exercises', 'example', 'file3');
const file4Path = path.join('exercises', 'example', 'subdir', 'file4');
const file5Path = path.join('exercises', 'example', 'subdir', 'file5');
const file6Path = path.join('exercises', 'example', 'file6');
const readmePath = path.join('exercises', 'start', 'README.md');
const makefilePath = path.join('exercises', 'start', 'Makefile');
const tutorialPath = path.join('exercises', 'start', 'TUTORIAL.md');
const gitignorePath = '.gitignore';

const makeLocalChanges = async (programPath) => {
  // modified existing files
  await fse.outputFile(path.join(programPath, file1Path), 'local content');
  await fse.outputFile(path.join(programPath, file2Path), 'local content');
  await git.add({ filepath: 'exercises/example/subdir/file2', dir: programPath });
  await fse.outputFile(path.join(programPath, readmePath), 'local content');
  await git.add({ filepath: 'exercises/start/README.md', dir: programPath });
  await fse.outputFile(path.join(programPath, readmePath), 'local changed content');
  // create new files
  await fse.outputFile(path.join(programPath, file3Path), 'local content');
  await fse.outputFile(path.join(programPath, file4Path), 'local content');
  await git.add({ filepath: 'exercises/example/subdir/file4', dir: programPath });
  await fse.outputFile(path.join(programPath, file5Path), 'local content');
  await git.add({ filepath: 'exercises/example/subdir/file5', dir: programPath });
  await fse.outputFile(path.join(programPath, file5Path), 'local changed content');
  await fse.outputFile(path.join(programPath, file6Path), 'local content');
  await git.add({ filepath: 'exercises/example/file6', dir: programPath });
  await fse.remove(path.join(programPath, file6Path));
  // remove file and remove file from index
  await git.remove({ filepath: 'spec.yml', dir: programPath });
  await fse.remove(path.join(programPath, gitignorePath));
  // remove file and then changed (same as change and then delete) => modified
  await git.remove({ filepath: 'exercises/start/Makefile', dir: programPath });
  await fse.outputFile(path.join(programPath, makefilePath), 'local new content');
};

describe('program submit', () => {
  let hexletProgramPath;
  let hexletConfigPath;
  let customSettings;
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
    customSettings = { homedir: tmpDir };
    const settings = initSettings(customSettings);
    hexletConfigPath = settings.hexletConfigPath;
    await fse.mkdirp(settings.hexletConfigDir);
    hexletDir = path.join(tmpDir, 'learning', 'Hexlet');
    await fse.mkdirp(hexletDir);
    hexletProgramPath = settings.generateHexletProgramPath(hexletDir, program);
  });

  it('no local changes, remote repo has new exercises', async () => {
    const cloneUrl = `${baseUrl}/program-10.git`;
    const remoteUrl = `${baseUrl}/program-20.git`;

    const config = getProgramConfig({ hexletDir, program, remoteUrl });
    await fse.writeJson(hexletConfigPath, config);

    await git.clone({ dir: hexletProgramPath, url: cloneUrl });
    await git.remoteSetUrl({ dir: hexletProgramPath, url: remoteUrl });
    expect(await git.lsFiles({ dir: hexletProgramPath })).toEqual(workDirStates.repo10);

    const actualCommits1 = await git.logMessages({ dir: hexletProgramPath });
    const expectedCommits1 = [
      'init',
    ];
    expect(actualCommits1).toEqual(expectedCommits1);

    await programCmd.handler(args, customSettings);
    expect(await git.lsFiles({ dir: hexletProgramPath }))
      .toEqual(workDirStates.repo20);

    const actualCommits2 = await git.logMessages({ dir: hexletProgramPath });
    const expectedCommits2 = [
      'add example',
      'download start',
      'init',
    ];
    expect(actualCommits2).toEqual(expectedCommits2);
  });

  it('no local changes, remote repo has new file & changed file', async () => {
    const cloneUrl = `${baseUrl}/program-20.git`;
    const remoteUrl = `${baseUrl}/program-30.git`;

    const config = getProgramConfig({ hexletDir, program, remoteUrl });
    await fse.writeJson(hexletConfigPath, config);

    await git.clone({ dir: hexletProgramPath, url: cloneUrl });
    await git.remoteSetUrl({ dir: hexletProgramPath, url: remoteUrl });
    expect(await git.lsFiles({ dir: hexletProgramPath })).toEqual(workDirStates.repo20);

    const actualCommits1 = await git.logMessages({ dir: hexletProgramPath });
    const expectedCommits1 = [
      'add example',
      'download start',
      'init',
    ];
    expect(actualCommits1).toEqual(expectedCommits1);

    expect(await readFile(path.join(hexletProgramPath, file1Path)))
      .toEqual('init content');

    await programCmd.handler(args, customSettings);
    expect(await git.lsFiles({ dir: hexletProgramPath })).toEqual(workDirStates.repo30);

    const actualCommits2 = await git.logMessages({ dir: hexletProgramPath });
    const expectedCommits2 = [
      'add file2 & change file1',
      'add example',
      'download start',
      'init',
    ];
    expect(actualCommits2).toEqual(expectedCommits2);

    expect(await readFile(path.join(hexletProgramPath, file1Path)))
      .toEqual('changed content');
    expect(await readFile(path.join(hexletProgramPath, file2Path)))
      .toEqual('init content');
  });

  it('local repo has changes, remote repo has no changes', async () => {
    const cloneUrl = `${baseUrl}/program-30.git`;

    const config = getProgramConfig({ hexletDir, program, remoteUrl: cloneUrl });
    await fse.writeJson(hexletConfigPath, config);

    await git.clone({ dir: hexletProgramPath, url: cloneUrl });
    expect(await git.lsFiles({ dir: hexletProgramPath })).toEqual(workDirStates.repo30);

    const actualCommits1 = await git.logMessages({ dir: hexletProgramPath });
    const expectedCommits1 = [
      'add file2 & change file1',
      'add example',
      'download start',
      'init',
    ];
    expect(actualCommits1).toEqual(expectedCommits1);

    await makeLocalChanges(hexletProgramPath);
    expect(await git.lsFiles({ dir: hexletProgramPath })).toEqual(workDirStates.repo30changed);

    await programCmd.handler(args, customSettings);
    expect(await git.lsFiles({ dir: hexletProgramPath })).toEqual(workDirStates.repo30afterPull30);

    const actualCommits2 = await git.logMessages({ dir: hexletProgramPath });
    const expectedCommits2 = [
      '@hexlet/cli: submit',
      'add file2 & change file1',
      'add example',
      'download start',
      'init',
    ];
    expect(actualCommits2).toEqual(expectedCommits2);

    expect(await readFile(path.join(hexletProgramPath, file1Path)))
      .toEqual('local content');
    expect(await readFile(path.join(hexletProgramPath, file2Path)))
      .toEqual('local content');
    expect(await readFile(path.join(hexletProgramPath, readmePath)))
      .toEqual('local changed content');
    expect(await readFile(path.join(hexletProgramPath, file3Path)))
      .toEqual('local content');
    expect(await readFile(path.join(hexletProgramPath, file4Path)))
      .toEqual('local content');
    expect(await readFile(path.join(hexletProgramPath, file5Path)))
      .toEqual('local changed content');
    expect(await readFile(path.join(hexletProgramPath, makefilePath)))
      .toEqual('local new content');
  });

  it('local repo has changes, remote repo has commit with conflicts', async () => {
    const cloneUrl = `${baseUrl}/program-30.git`;
    const remoteUrl = `${baseUrl}/program-40.git`;

    const config = getProgramConfig({ hexletDir, program, remoteUrl });
    await fse.writeJson(hexletConfigPath, config);

    await git.clone({ dir: hexletProgramPath, url: cloneUrl });
    await git.remoteSetUrl({ dir: hexletProgramPath, url: remoteUrl });
    expect(await git.lsFiles({ dir: hexletProgramPath })).toEqual(workDirStates.repo30);

    const actualCommits1 = await git.logMessages({ dir: hexletProgramPath });
    const expectedCommits1 = [
      'add file2 & change file1',
      'add example',
      'download start',
      'init',
    ];
    expect(actualCommits1).toEqual(expectedCommits1);

    await makeLocalChanges(hexletProgramPath);
    expect(await git.lsFiles({ dir: hexletProgramPath })).toEqual(workDirStates.repo30changed);

    await programCmd.handler(args, customSettings);
    expect(await git.lsFiles({ dir: hexletProgramPath })).toEqual(workDirStates.repo30afterPull40);

    const actualCommits2 = await git.logMessages({ dir: hexletProgramPath });
    // NOTE: коммит с конфликтами вмерджен до локальных изменений, как и планировалось
    const expectedCommits2 = [
      '@hexlet/cli: submit',
      'change file1, file2 & add file3 & remove .gitignore',
      'add file2 & change file1',
      'add example',
      'download start',
      'init',
    ];
    expect(actualCommits2).toEqual(expectedCommits2);

    expect(await readFile(path.join(hexletProgramPath, file1Path)))
      .toEqual('local content');
    expect(await readFile(path.join(hexletProgramPath, file2Path)))
      .toEqual('local content');
    expect(await readFile(path.join(hexletProgramPath, readmePath)))
      .toEqual('local changed content');
    expect(await readFile(path.join(hexletProgramPath, file3Path)))
      .toEqual('local content');
    expect(await readFile(path.join(hexletProgramPath, file4Path)))
      .toEqual('local content');
    expect(await readFile(path.join(hexletProgramPath, file5Path)))
      .toEqual('local changed content');
    expect(await readFile(path.join(hexletProgramPath, makefilePath)))
      .toEqual('local new content');
  });

  it('local repo has changes with commit, remote repo has commit without conflicts', async () => {
    const cloneUrl = `${baseUrl}/program-30.git`;
    const remoteUrl = `${baseUrl}/program-50.git`;

    const config = getProgramConfig({ hexletDir, program, remoteUrl });
    await fse.writeJson(hexletConfigPath, config);

    await git.clone({ dir: hexletProgramPath, url: cloneUrl });
    await git.remoteSetUrl({ dir: hexletProgramPath, url: remoteUrl });
    expect(await git.lsFiles({ dir: hexletProgramPath })).toEqual(workDirStates.repo30);

    const actualCommits1 = await git.logMessages({ dir: hexletProgramPath });
    const expectedCommits1 = [
      'add file2 & change file1',
      'add example',
      'download start',
      'init',
    ];
    expect(actualCommits1).toEqual(expectedCommits1);

    await makeLocalChanges(hexletProgramPath);
    expect(await git.lsFiles({ dir: hexletProgramPath })).toEqual(workDirStates.repo30changed);
    await git.addAll({ dir: hexletProgramPath });
    await git.commit({ message: 'local commit', author, dir: hexletProgramPath });
    expect(await git.lsFiles({ dir: hexletProgramPath })).toEqual(workDirStates.repo30afterPull30);

    await programCmd.handler(args, customSettings);
    expect(await git.lsFiles({ dir: hexletProgramPath })).toEqual(workDirStates.repo30afterPull50);

    const actualCommits2 = await git.logMessages({ dir: hexletProgramPath });
    // NOTE: выполнен мердж, конфликтов нет.
    const expectedCommits2 = [
      "Merge branch 'main' of http://localhost:8888/program-50.git",
      'local commit',
      'add anotherFile & change tutorial',
      'add tutorial',
      'add file2 & change file1',
      'add example',
      'download start',
      'init',
    ];
    expect(actualCommits2).toEqual(expectedCommits2);

    expect(await readFile(path.join(hexletProgramPath, file1Path)))
      .toEqual('local content');
    expect(await readFile(path.join(hexletProgramPath, file2Path)))
      .toEqual('local content');
    expect(await readFile(path.join(hexletProgramPath, readmePath)))
      .toEqual('local changed content');
    expect(await readFile(path.join(hexletProgramPath, file3Path)))
      .toEqual('local content');
    expect(await readFile(path.join(hexletProgramPath, file4Path)))
      .toEqual('local content');
    expect(await readFile(path.join(hexletProgramPath, file5Path)))
      .toEqual('local changed content');
    expect(await readFile(path.join(hexletProgramPath, makefilePath)))
      .toEqual('local new content');
    expect(await readFile(path.join(hexletProgramPath, anotherFilePath)))
      .toEqual('remote content');
    expect(await readFile(path.join(hexletProgramPath, tutorialPath)))
      .toEqual('remote content');
  });

  // NOTE: локально выполнен вручную коммит, но не запушен в удалённый репозиторий).
  // Удалённый репозиторий содержит коммит с конфликтами (он локально отсутствует),
  // Submit провален, нужно делать pull и исправлять конфликты вручную!
  it('local repo has changes with commit, remote repo has commit with conflicts', async () => {
    const cloneUrl = `${baseUrl}/program-30.git`;
    const remoteUrl = `${baseUrl}/program-40.git`;

    const config = getProgramConfig({ hexletDir, program, remoteUrl });
    await fse.writeJson(hexletConfigPath, config);

    await git.clone({ dir: hexletProgramPath, url: cloneUrl });
    await git.remoteSetUrl({ dir: hexletProgramPath, url: remoteUrl });
    expect(await git.lsFiles({ dir: hexletProgramPath })).toEqual(workDirStates.repo30);

    const actualCommits1 = await git.logMessages({ dir: hexletProgramPath });
    const expectedCommits1 = [
      'add file2 & change file1',
      'add example',
      'download start',
      'init',
    ];
    expect(actualCommits1).toEqual(expectedCommits1);

    await makeLocalChanges(hexletProgramPath);
    expect(await git.lsFiles({ dir: hexletProgramPath })).toEqual(workDirStates.repo30changed);
    await git.addAll({ dir: hexletProgramPath });
    await git.commit({ message: 'local commit', author, dir: hexletProgramPath });
    expect(await git.lsFiles({ dir: hexletProgramPath })).toEqual(workDirStates.repo30afterPull30);

    await expect(programCmd.handler(args, customSettings))
      .rejects.toThrow(git.Errors.MergeNotSupportedError);
    expect(await git.lsFiles({ dir: hexletProgramPath })).toEqual(workDirStates.repo30afterPull30);

    const actualCommits2 = await git.logMessages({ dir: hexletProgramPath });
    // NOTE: выполнен мердж, конфликтов нет.
    const expectedCommits2 = [
      'local commit',
      'add file2 & change file1',
      'add example',
      'download start',
      'init',
    ];
    expect(actualCommits2).toEqual(expectedCommits2);

    expect(await readFile(path.join(hexletProgramPath, file1Path)))
      .toEqual('local content');
    expect(await readFile(path.join(hexletProgramPath, file2Path)))
      .toEqual('local content');
    expect(await readFile(path.join(hexletProgramPath, readmePath)))
      .toEqual('local changed content');
    expect(await readFile(path.join(hexletProgramPath, file3Path)))
      .toEqual('local content');
    expect(await readFile(path.join(hexletProgramPath, file4Path)))
      .toEqual('local content');
    expect(await readFile(path.join(hexletProgramPath, file5Path)))
      .toEqual('local changed content');
    expect(await readFile(path.join(hexletProgramPath, makefilePath)))
      .toEqual('local new content');
  });

  it('remote repository is ahead of the local one by 1 commit (deleted some files)', async () => {
    const cloneUrl = `${baseUrl}/program-30.git`;
    const remoteUrl = `${baseUrl}/program-60.git`;

    const config = getProgramConfig({ hexletDir, program, remoteUrl });
    await fse.writeJson(hexletConfigPath, config);

    await git.clone({ dir: hexletProgramPath, url: cloneUrl });
    await git.remoteSetUrl({ dir: hexletProgramPath, url: remoteUrl });
    expect(await git.lsFiles({ dir: hexletProgramPath })).toEqual(workDirStates.repo30);

    const actualCommits1 = await git.logMessages({ dir: hexletProgramPath });
    const expectedCommits1 = [
      'add file2 & change file1',
      'add example',
      'download start',
      'init',
    ];
    expect(actualCommits1).toEqual(expectedCommits1);

    await programCmd.handler(args, customSettings);
    expect(await git.lsFiles({ dir: hexletProgramPath })).toEqual(workDirStates.repo30afterPull60);

    const actualCommits2 = await git.logMessages({ dir: hexletProgramPath });
    const expectedCommits2 = [
      'remove file1',
      'add file2 & change file1',
      'add example',
      'download start',
      'init',
    ];
    expect(actualCommits2).toEqual(expectedCommits2);
  });
});
