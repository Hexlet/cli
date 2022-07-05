// @ts-check

const os = require('os');
const path = require('path');
const fsp = require('fs/promises');
const fse = require('fs-extra');
const nock = require('nock');
const git = require('isomorphic-git');

const assignmentsInitCmd = require('../../src/commands/assignments-init.js');
const { getValidator } = require('../../src/validator/index.js');
const { getFixturePath, readDirP } = require('../helpers/index.js');

const githubToken = 'some-github-token';
const hexletToken = 'some-hexlet-token';
const commandParts = ['assignments', 'init'];
const args = {
  githubToken, hexletToken, _: commandParts,
};
const githubUser = 'exampleuser';
const repoName = 'hexlet-assignments';
const secretName = 'HEXLET_TOKEN';
const branch = 'main';

const mockServerHost = 'localhost:8888';
const baseUrl = `http://${mockServerHost}`;

describe('program', () => {
  let customSettings;
  let hexletDir;

  beforeAll(() => {
    nock.disableNetConnect();
    nock.enableNetConnect(new RegExp(mockServerHost));

    const scope = nock('https://api.github.com').persist();

    scope
      .get('/')
      .reply(200, {}, {
        'x-oauth-scopes': 'repo, workflow',
      });
    scope
      .get('/user')
      .reply(200, { login: githubUser });
    scope
      .get(`/repos/${githubUser}/${repoName}`)
      .reply(404);
    scope
      .post('/user/repos')
      .reply(201, {
        html_url: `${baseUrl}/assignments-empty`,
        clone_url: `${baseUrl}/assignments-empty.git`,
      });
    scope
      .get(`/repos/${githubUser}/${repoName}/actions/secrets/public-key`)
      .reply(200, {
        key_id: '012345678912345678',
        key: 'pTkCe8klWSqGB9ZYJ+nLJknKMjfcfHWnU2irP+AS5zw=',
      });
    scope
      .put(`/repos/${githubUser}/${repoName}/actions/secrets/${secretName}`)
      .reply(201);
    scope
      .get(`/repos/${githubUser}/${repoName}/branches/${branch}`)
      .reply(404);

    git.push = jest.fn(() => {});
  });

  beforeEach(async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'hexlet-cli-'));
    customSettings = { homedir: tmpDir };
    hexletDir = path.join(tmpDir, 'learning', 'Hexlet');
  });

  it('init without local config', async () => {
    const result = await assignmentsInitCmd.handler({ ...args, hexletDir }, customSettings);

    const actualConfig = await fse.readJson(result.hexletConfigPath);
    const expectedConfig = await fse.readJson(getFixturePath('assignmentsConfig.json'));
    expectedConfig.hexletDir = hexletDir;
    expect(actualConfig).toEqual(expectedConfig);

    const validate = getValidator('assignments');
    expect(validate(actualConfig)).toBeTruthy();

    expect(await readDirP(hexletDir)).toMatchSnapshot();
  });

  it('init with program config', async () => {
    await fse.copy(
      getFixturePath('programConfig.json'),
      path.join(customSettings.homedir, 'Hexlet', '.config.json'),
    );
    const result = await assignmentsInitCmd.handler({ ...args, hexletDir }, customSettings);

    const actualConfig = await fse.readJson(result.hexletConfigPath);
    const expectedConfig = await fse.readJson(getFixturePath('config.json'));
    expectedConfig.hexletDir = hexletDir;
    expect(actualConfig).toEqual(expectedConfig);

    const validate = getValidator('assignments');
    expect(validate(actualConfig)).toBeTruthy();

    expect(await readDirP(hexletDir)).toMatchSnapshot();
  });
});
