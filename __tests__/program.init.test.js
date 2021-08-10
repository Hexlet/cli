const os = require('os');
const path = require('path');
const git = require('isomorphic-git');
const fsp = require('fs/promises');
const fse = require('fs-extra');
const nock = require('nock');

const programCmd = require('../src/commands/program/init.js');
const { getValidator } = require('../src/validator.js');
const { getFixturePath } = require('./helpers/index.js');

nock.disableNetConnect();

describe('program', () => {
  const scope = nock('https://gitlab.com/api/v4').persist();
  let customSettings;
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'hexlet-cli-'));
    customSettings = { homedir: tmpDir };
  });

  it('init', async () => {
    const hexletUserId = '123';
    const gitlabGroupId = '456789';
    const gitlabToken = 'some-token';
    const hexletDir = path.join(tmpDir, 'learning', 'Hexlet');

    scope.get(`/namespaces/${gitlabGroupId}`)
      .reply(200, {
        full_path: 'hexlet/programs/ruby/groups/test-group',
        path: 'test-group',
      });

    scope.post('/projects')
      .replyWithError('Failed to create project');

    const project = {
      web_url: `https://gitlab.com/hexlet/programs/ruby/groups/test-group/${hexletUserId}`,
      http_url_to_repo: `https://gitlab.com/hexlet/programs/ruby/groups/test-group/${hexletUserId}.git`,
      ssh_url_to_repo: `git@gitlab.com:hexlet/programs/ruby/groups/test-group/${hexletUserId}.git`,
    };
    scope.get(`/projects/hexlet%2Fprograms%2Fruby%2Fgroups%2Ftest-group%2F${hexletUserId}`)
      .reply(200, project);

    scope.post(`/projects/hexlet%2Fprograms%2Fruby%2Fgroups%2Ftest-group%2F${hexletUserId}/repository/commits`)
      .reply(200, {});

    git.clone = jest.fn(() => {});
    git.pull = jest.fn(() => {});

    const args = {
      hexletUserId, gitlabGroupId, gitlabToken, hexletDir,
    };
    const result = await programCmd.handler(args, customSettings);

    const actualConfig = await fse.readJson(result.hexletConfigPath);
    const expectedConfig = await fse.readJson(getFixturePath('config.json'));
    expectedConfig.hexletDir = hexletDir;
    expect(actualConfig).toEqual(expectedConfig);

    const validate = getValidator();
    expect(validate(actualConfig)).toBeTruthy();
  });
});
