const os = require('os');
const path = require('path');
const git = require('isomorphic-git');
const fsp = require('fs/promises');
const fse = require('fs-extra');
const nock = require('nock');

const programCmd = require('../src/commands/program/init.js');
const { getFixturePath } = require('./helpers/index.js');

nock.disableNetConnect();

describe('program', () => {
  const scope = nock('https://gitlab.com').persist();
  let defaults;

  beforeEach(async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'hexlet-cli-'));
    defaults = { homedir: tmpDir };
  });

  it('init', async () => {
    scope.get('/api/v4/namespaces/jopa')
      .reply(200, { full_path: 'hexlet/programs/jopa', path: 'jopa' });

    scope.post('/api/v4/projects')
      .replyWithError('Failed to create project');

    const project = {
      web_url: 'lala',
      http_url_to_repo: 'https://gitlab.com/repository.git',
      ssh_url_to_repo: 'git://gitlab.com/repository.git',
    };
    scope.get('/api/v4/projects/hexlet%2Fprograms%2Fjopa%2F1')
      .reply(200, project);

    scope.post('/api/v4/projects/hexlet%2Fprograms%2Fjopa%2F1/repository/commits')
      .reply(200, {});

    git.clone = jest.fn(() => {});
    git.pull = jest.fn(() => {});

    const args = {
      hexletUserId: '1',
      gitlabGroupId: 'jopa',
      gitlabToken: 'some-token',
    };
    const result = await programCmd.handler(args, defaults);

    const actualConfig = await fse.readJson(result.hexletConfigPath);
    const expectedConfig = await fse.readJson(getFixturePath('.config.json'));
    expect(actualConfig).toMatchObject(expectedConfig);
  });
});
