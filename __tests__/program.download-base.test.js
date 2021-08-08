const os = require('os');
const path = require('path');
const fsp = require('fs/promises');
const fse = require('fs-extra');
const nock = require('nock');

const programCmd = require('../src/commands/program/download.js');
const initSettings = require('../src/settings.js');

const args = {
  program: 'ruby',
  exercise: 'fundamentals',
  token: 'some-token',
};

nock.disableNetConnect();

describe('program', () => {
  let hexletConfigPath;
  let customSettings;

  beforeEach(async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'hexlet-cli-'));
    customSettings = { homedir: tmpDir };
    const {
      hexletConfigPath: configPath,
    } = initSettings(customSettings);
    hexletConfigPath = configPath;
    const configDir = path.dirname(hexletConfigPath);
    const hexletDir = path.join(tmpDir, 'learning', 'Hexlet');
    await fse.mkdirp(hexletDir);
    await fse.mkdirp(configDir);
  });

  it('download (without init)', async () => {
    await expect(programCmd.handler(args, customSettings))
      .rejects.toThrow('no such file or directory');
  });

  it('download with invalid config.json', async () => {
    await fse.writeJson(hexletConfigPath, {});

    await expect(programCmd.handler(args, customSettings))
      .rejects.toThrow(`Validation error "${hexletConfigPath}"`);
  });
});
