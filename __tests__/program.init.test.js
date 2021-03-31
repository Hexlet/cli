const os = require('os');
const path = require('path');
const git = require('isomorphic-git');
const fsp = require('fs/promises');
const fse = require('fs-extra');
const nock = require('nock');

const programCmd = require('../src/commands/program/init.js');
// const programDownloadCmd = require('../src/commands/program/download.js');

nock.disableNetConnect();

let defaults;

describe('program', () => {
  beforeEach(async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'hexlet-cli-'));
    defaults = { homedir: tmpDir };
  });

  it('init', async () => {
    nock('https://gitlab.com')
      .get('/api/v4/namespaces/test-group')
      .reply(200, { full_path: 'hexlet/jopa', path: 'jopa' });

    const project = {
      web_url: 'lala',
      http_url_to_repo: 'https://gitlab.com/repository.git',
      ssh_url_to_repo: 'git://gitlab.com/repository.git',
    };
    nock('https://gitlab.com')
      .get('/api/v4/projects/hexlet%2Fjopa%2F1')
      .reply(200, project);

    nock('https://gitlab.com')
      .post('/api/v4/projects/hexlet%2Fjopa%2F1/repository/commits')
      .reply(200, {});

    git.clone = jest.fn(() => {});
    git.pull = jest.fn(() => {});

    const args = {
      program: 'ruby',
      userId: '1',
      groupId: 'test-group',
      token: 'some-token',
      customSettings: defaults,
    };
    const result = await programCmd.handler(args, defaults);
    const data = await fse.readJson(result.hexletConfigPath);

    expect(data).toMatchObject({ userId: args.userId });
  });
});
