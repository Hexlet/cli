const os = require('os');
const path = require('path');
const fsp = require('fs/promises');
const fse = require('fs-extra');
const nock = require('nock');

const programCmd = require('../src/commands/program/download.js');
const initSettings = require('../src/settings.js');
const { readDirP, getFixturePath } = require('./helpers/index.js');

const getTmpDirPath = (program) => path.join(os.tmpdir(), `${program}-program`);

const program = 'ruby';
const args = {
  program,
  exercise: 'fundamentals',
};

nock.disableNetConnect();

describe('program', () => {
  let hexletConfigPath;
  let customSettings;
  let hexletDir;

  beforeEach(async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'hexlet-cli-'));
    customSettings = { homedir: tmpDir };
    const {
      hexletConfigPath: configPath,
    } = initSettings(customSettings);
    hexletConfigPath = configPath;
    const configDir = path.dirname(hexletConfigPath);
    await fse.mkdirp(configDir);
    hexletDir = path.join(tmpDir, 'learning', 'Hexlet');
    await fse.mkdirp(hexletDir);
  });

  it('download', async () => {
    const config = await fse.readJson(getFixturePath('config.json'));
    config.hexletDir = hexletDir;
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
});
