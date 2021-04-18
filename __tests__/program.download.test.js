const os = require('os');
const path = require('path');
const git = require('isomorphic-git');
const fsp = require('fs/promises');
const fse = require('fs-extra');
const nock = require('nock');

const programCmd = require('../src/commands/program/download.js');
const initSettings = require('../src/settings.js');
// const programDownloadCmd = require('../src/commands/program/download.js');
const fixturesPath = path.join(__dirname, '../__fixtures__');

nock.disableNetConnect();

let defaults;

describe('program', () => {
  beforeEach(async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'hexlet-cli-'));
    // const data = await fse.readJson(result.hexletConfigPath);
    defaults = { homedir: tmpDir };
  });

  it('download', async () => {
    const { hexletDir, hexletConfigPath } = initSettings(defaults);
    await fsp.mkdir(hexletDir);
    await fse.writeJson(hexletConfigPath, {});

    const programArchivePath = path.join(fixturesPath, 'ruby-program.tar.gz');
    nock('https://hexlet-programs.fra1.digitaloceanspaces.com')
      .get('/ruby-program.tar.gz')
      .replyWithFile(200, programArchivePath);

    // const project = {
    //   web_url: 'lala',
    //   http_url_to_repo: 'https://gitlab.com/repository.git',
    //   ssh_url_to_repo: 'git://gitlab.com/repository.git',
    // };
    // nock('https://gitlab.com')
    //   .get('/api/v4/projects/hexlet%2Fjopa%2F1')
    //   .reply(200, project);

    // nock('https://gitlab.com')
    //   .post('/api/v4/projects/hexlet%2Fjopa%2F1/repository/commits')
    //   .reply(200, {});

    git.clone = jest.fn(() => {});

    const args = {
      program: 'ruby',
      exercise: 'hello-world',
      token: 'some-token',
      customSettings: defaults,
    };
    await programCmd.handler(args, defaults);
    // const data = await fse.readJson(result.hexletConfigPath);

    // FIXME add expectations
    expect(true).toBe(true);
    // expect(data).toMatchObject({ userId: args.userId });
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
