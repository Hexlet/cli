// @ts-check

const os = require('os');
const path = require('path');
const git = require('isomorphic-git');
const fsp = require('fs/promises');
const fse = require('fs-extra');
const nock = require('nock');

const programCmd = require('../../src/commands/program/init.js');
const { getValidator } = require('../../src/validator/index.js');
const { getFixturePath } = require('../helpers/index.js');

const hexletUserId = '123';
const gitlabGroupId = '456789';
const gitlabToken = 'some-token';
const commandParts = ['program', 'init'];
const args = {
  hexletUserId, gitlabGroupId, gitlabToken, _: commandParts,
};

const project = {
  web_url: `https://gitlab.com/hexlet/programs/ruby/groups/test-group/${hexletUserId}`,
  http_url_to_repo: `https://gitlab.com/hexlet/programs/ruby/groups/test-group/${hexletUserId}.git`,
  ssh_url_to_repo: `git@gitlab.com:hexlet/programs/ruby/groups/test-group/${hexletUserId}.git`,
};

describe('program', () => {
  let customSettings;
  let hexletDir;

  beforeAll(() => {
    nock.disableNetConnect();
    const scope = nock('https://gitlab.com/api/v4').persist();

    scope.get(`/namespaces/${gitlabGroupId}`)
      .reply(200, {
        full_path: 'hexlet/programs/ruby/groups/test-group',
        path: 'test-group',
      });
    scope.post('/projects')
      .replyWithError('Failed to create project');
    scope.get(`/projects/hexlet%2Fprograms%2Fruby%2Fgroups%2Ftest-group%2F${hexletUserId}`)
      .reply(200, project);
    scope.post(`/projects/hexlet%2Fprograms%2Fruby%2Fgroups%2Ftest-group%2F${hexletUserId}/repository/commits`)
      .reply(200, {});

    git.clone = jest.fn(() => {});
    git.pull = jest.fn(() => {});
  });

  beforeEach(async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'hexlet-cli-'));
    customSettings = { homedir: tmpDir };
    hexletDir = path.join(tmpDir, 'learning', 'Hexlet');
  });

  it('init without local config', async () => {
    const result = await programCmd.handler({ ...args, hexletDir }, customSettings);

    const actualConfig = await fse.readJson(result.hexletConfigPath);
    const expectedConfig = await fse.readJson(getFixturePath('programConfig.json'));
    expectedConfig.hexletDir = hexletDir;
    expect(actualConfig).toEqual(expectedConfig);

    const validate = getValidator('program');
    expect(validate(actualConfig)).toBeTruthy();
  });

  it('init with assignment config', async () => {
    await fse.copy(
      getFixturePath('assignmentsConfig.json'),
      path.join(customSettings.homedir, 'Hexlet', '.config.json'),
    );
    const result = await programCmd.handler({ ...args, hexletDir }, customSettings);

    const actualConfig = await fse.readJson(result.hexletConfigPath);
    const expectedConfig = await fse.readJson(getFixturePath('config.json'));
    expectedConfig.hexletDir = hexletDir;
    expect(actualConfig).toEqual(expectedConfig);

    const validate = getValidator('program');
    expect(validate(actualConfig)).toBeTruthy();
  });
});
