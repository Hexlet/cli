const os = require('os');
const path = require('path');
const fsp = require('fs/promises');
const fse = require('fs-extra');
const nock = require('nock');

const programInitCmd = require('../src/commands/program/init.js');
// const programDownloadCmd = require('../src/commands/program/download.js');

nock.disableNetConnect();

let defaults;

describe('program', () => {
  beforeEach(async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'foo-'));
    defaults = { homedir: tmpDir };
  });

  it('init', async () => {
    nock('https://gitlab.com')
      .get('/api/v4/namespaces/test-group')
      .reply(200, { full_path: 'hexlet/jopa', path: 'jopa' });

    nock('https://gitlab.com')
      .get('/api/v4/projects/jopa%2F1')
      .reply(200, { web_url: 'lala' });

    nock('https://gitlab.com')
      .post('/api/v4/projects/hexlet%2Fjopa%2F1/repository/commits')
      .reply(200, {});

    nock('https://gitlab.com')
      .get('/api/v4/projects/hexlet%2Fjopa%2F1')
      .reply(200, {});

    const args = {
      program: 'ruby',
      id: 1,
      groupId: 'test-group',
      token: 'some-token',
    };
    const result = await programInitCmd.handler(args, defaults);
    const data = await fse.readJson(result.hexletConfigPath);

    expect(data).toMatchObject({ id: args.id });
  });
});
