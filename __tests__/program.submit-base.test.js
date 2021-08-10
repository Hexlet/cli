const os = require('os');
const path = require('path');
const fsp = require('fs/promises');
const fse = require('fs-extra');
const nock = require('nock');

const programCmd = require('../src/commands/program/submit.js');
const initSettings = require('../src/settings.js');

const program = 'ruby';
const args = { program };

nock.disableNetConnect();

describe('program submit base', () => {
  let hexletConfigPath;
  let customSettings;

  beforeEach(async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'hexlet-cli-'));
    customSettings = { homedir: tmpDir };
    const settings = initSettings(customSettings);
    hexletConfigPath = settings.hexletConfigPath;
    const hexletDir = path.join(tmpDir, 'learning', 'Hexlet');
    await fse.mkdirp(hexletDir);
    await fse.mkdirp(settings.hexletConfigDir);
  });

  it('submit (without init)', async () => {
    await expect(programCmd.handler(args, customSettings))
      .rejects.toThrow('no such file or directory');
  });

  it('submit with invalid config.json', async () => {
    await fse.writeJson(hexletConfigPath, {});

    await expect(programCmd.handler(args, customSettings))
      .rejects.toThrow(`Validation error "${hexletConfigPath}"`);
  });
});
