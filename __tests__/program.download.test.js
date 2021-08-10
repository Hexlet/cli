const os = require('os');
const path = require('path');
const fsp = require('fs/promises');
const fse = require('fs-extra');
const nock = require('nock');

const programCmd = require('../src/commands/program/download.js');
const initSettings = require('../src/settings.js');
const { readDirP, getFixturePath, getConfig } = require('./helpers/index.js');

const getTmpDirPath = (program) => path.join(os.tmpdir(), `${program}-program`);

const program = 'ruby';

const args = {
  program,
  exercise: 'fundamentals',
  token: 'some-token',
};

nock.disableNetConnect();

describe('program', () => {
  let hexletConfigPath;
  let customSettings;
  let hexletDir;
  let config;

  beforeEach(async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'hexlet-cli-'));
    customSettings = { homedir: tmpDir };
    const settings = initSettings(customSettings);
    hexletConfigPath = settings.hexletConfigPath;
    await fse.mkdirp(settings.hexletConfigDir);
    hexletDir = path.join(tmpDir, 'learning', 'Hexlet');
    await fse.mkdirp(hexletDir);
    config = getConfig({ hexletDir, program });
  });

  it('download', async () => {
    await fse.writeJson(hexletConfigPath, config);

    const programArchivePath = getFixturePath('ruby-program.tar.gz');
    nock('https://hexlet-programs.fra1.digitaloceanspaces.com')
      .get('/ruby-program.tar.gz')
      .replyWithFile(200, programArchivePath);

    await programCmd.handler(args, customSettings);

    const tmpDirPath = getTmpDirPath(program);
    expect(await readDirP(tmpDirPath)).toMatchSnapshot();

    expect(await readDirP(hexletDir)).toMatchSnapshot();
  });

  it('download (without init)', async () => {
    await expect(programCmd.handler(args, customSettings))
      .rejects.toThrow('no such file or directory');
  });

  it('download with invalid .config.json', async () => {
    await fse.writeJson(hexletConfigPath, {});

    await expect(programCmd.handler(args, customSettings))
      .rejects.toThrow(`Validation error "${hexletConfigPath}"`);
  });
});
