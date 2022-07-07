// @ts-check

const os = require('os');
const path = require('path');
const fsp = require('fs/promises');
const fse = require('fs-extra');
const nock = require('nock');

const assignmentsSubmitCmd = require('../../src/commands/assignment/submit.js');
const { initSettings } = require('../../src/config.js');

const args = {
  _: ['assignment', 'submit'],
};

describe('assignment submit base', () => {
  let hexletConfigPath;
  let customSettings;

  beforeAll(() => {
    nock.disableNetConnect();
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
  });

  it('submit (without init)', async () => {
    await expect(assignmentsSubmitCmd.handler(args, customSettings))
      .rejects.toThrow('no such file or directory');
  });

  it('submit with invalid .config.json', async () => {
    await fse.writeJson(hexletConfigPath, {});

    await expect(assignmentsSubmitCmd.handler(args, customSettings))
      .rejects.toThrow(`Validation error "${hexletConfigPath}"`);
  });
});
