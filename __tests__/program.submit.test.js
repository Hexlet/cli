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
  const args = {
    program: 'ruby',
    exercise: 'fundamentals',
  };
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

    await programCmd.handler(args, defaults);

    const actualCurrent = await fse.readJson(path.join(hexletProgramPath, '.current.json'));
    const expectedCurrent = await fse.readJson(getFixturePath('.current.json'));
    expect(actualCurrent).toMatchObject(expectedCurrent);

    expect(true).toBe(true);
  });

  it('submit (without init)', async () => {
    await expect(programCmd.handler(args, defaults))
      .rejects.toThrow('no such file or directory');
  });

  it('submit with wrong exercise', async () => {
    const { hexletConfigPath } = initSettings(defaults);
    await fse.copy(getFixturePath('.config.json'), hexletConfigPath);

    const wrongArgs = {
      program: 'ruby',
      exercise: 'wrongExercise',
    };
    await expect(programCmd.handler(wrongArgs, defaults))
      .rejects.toThrow('Exercise with name "wrongExercise" does not exists.');
  });

  it('submit with invalid .config.json', async () => {
    const { hexletDir, hexletConfigPath } = initSettings(defaults);
    await fsp.mkdir(hexletDir);
    await fse.writeJson(hexletConfigPath, {});

    await expect(programCmd.handler(args, defaults)).rejects.toThrow(`Validation error "${hexletConfigPath}"`);
  });
});
