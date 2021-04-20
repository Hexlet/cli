const os = require('os');
const path = require('path');
const git = require('isomorphic-git');
const fsp = require('fs/promises');
const fse = require('fs-extra');
const nock = require('nock');

const programCmd = require('../src/commands/program/submit.js');
const initSettings = require('../src/settings.js');
const { getFixturePath } = require('./helpers/index.js');

nock.disableNetConnect();

describe('program', () => {
  let defaults;

  beforeEach(async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'hexlet-cli-'));
    defaults = { homedir: tmpDir };
  });

  it('submit', async () => {
    const { hexletConfigPath, generateHexletProgramPath } = initSettings(defaults);
    const hexletProgramPath = generateHexletProgramPath('ruby');

    await fse.mkdirp(path.join(hexletProgramPath, 'exercises', 'fundamentals'));
    await fse.copy(getFixturePath('.config.json'), hexletConfigPath);

    git.pull = jest.fn(() => {});
    git.commit = jest.fn(() => {});
    git.push = jest.fn(() => {});

    const args = {
      program: 'ruby',
      exercise: 'fundamentals',
    };
    await programCmd.handler(args, defaults);

    const actualCurrent = await fse.readJson(path.join(hexletProgramPath, '.current.json'));
    const expectedCurrent = await fse.readJson(getFixturePath('.current.json'));
    expect(actualCurrent).toMatchObject(expectedCurrent);

    expect(true).toBe(true);
  });

  it('submit with wrong exercise', async () => {
    const { hexletConfigPath } = initSettings(defaults);
    await fse.copy(getFixturePath('.config.json'), hexletConfigPath);

    const args = {
      program: 'ruby',
      exercise: 'wrongExercise',
    };

    await expect(programCmd.handler(args, defaults))
      .rejects.toThrow('Exercise with name "wrongExercise" does not exists.');
  });

  it('submit (without init)', async () => {
    const args = {
      program: 'ruby',
      exercise: 'fundamentals',
      customSettings: defaults,
    };

    await expect(programCmd.handler(args, defaults))
      .rejects.toThrow('no such file or directory');
  });
});
