const os = require('os');
const path = require('path');
const git = require('isomorphic-git');
const fsp = require('fs/promises');
const fse = require('fs-extra');
const nock = require('nock');

const programCmd = require('../src/commands/program/download.js');
const initSettings = require('../src/settings.js');
const { readDirP, getFixturePath } = require('./helpers/index.js');

const getTmpDirPath = (program) => path.join(os.tmpdir(), `${program}-program`);

nock.disableNetConnect();

let defaults;

describe('program', () => {
  beforeEach(async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'hexlet-cli-'));
    defaults = { homedir: tmpDir };
  });

  it('download', async () => {
    const { hexletDir, hexletConfigPath } = initSettings(defaults);
    await fsp.mkdir(hexletDir);
    await fse.writeJson(hexletConfigPath, {});

    const programArchivePath = getFixturePath('ruby-program.tar.gz');
    nock('https://hexlet-programs.fra1.digitaloceanspaces.com')
      .get('/ruby-program.tar.gz')
      .replyWithFile(200, programArchivePath);

    git.clone = jest.fn(() => {});

    const args = {
      program: 'ruby',
      exercise: 'fundamentals',
      token: 'some-token',
      customSettings: defaults,
    };
    await programCmd.handler(args, defaults);

    const tmpDirPath = getTmpDirPath(args.program);
    expect(await readDirP(tmpDirPath)).toMatchSnapshot();

    expect(await readDirP(hexletDir)).toMatchSnapshot();
  });

  it('download (without init)', async () => {
    const args = {
      program: 'ruby',
      exercise: 'hello-world',
      token: 'some-token',
      customSettings: defaults,
    };

    await expect(() => programCmd.handler(args, defaults)).rejects.toThrow('no such file or directory');
  });
});
