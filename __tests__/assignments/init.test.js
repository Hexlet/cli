// @ts-check

const os = require('os');
const path = require('path');
const fsp = require('fs/promises');
const fse = require('fs-extra');
const nock = require('nock');
const isomorphicGit = require('isomorphic-git');

const command = require('../../src/commands/assignments-init.js');
const { getValidator } = require('../../src/validator/index.js');
const { getFixturePath, readDirP } = require('../helpers/index.js');
const { initSettings } = require('../../src/config.js');
const git = require('../../src/utils/git.js');

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

const enableInterceptors = (options = { remoteRepoExist: false }) => {
  const scope = nock('https://api.github.com');

  scope
    .get('/')
    .reply(200, {}, {
      'x-oauth-scopes': 'repo, workflow',
    });
  scope
    .get('/user')
    .reply(200, { login: githubUser });
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

  nock('https://hexlet.io/api')
    .post('/user/assignment_token/check', { token: /.+/ })
    .reply(200);

  if (options.remoteRepoExist) {
    scope
      .get(`/repos/${githubUser}/${repoName}`)
      .reply(200, {
        html_url: `${baseUrl}/assignments-20`,
        clone_url: `${baseUrl}/assignments-20.git`,
      });
    return;
  }

  scope
    .get(`/repos/${githubUser}/${repoName}`)
    .reply(404);
};

describe('program', () => {
  let customSettings;
  let hexletDir;
  let params;

  beforeAll(() => {
    nock.disableNetConnect();
    nock.enableNetConnect(new RegExp(mockServerHost));
    isomorphicGit.push = jest.fn(() => {});
  });

  afterAll(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  beforeEach(async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'hexlet-cli-'));
    customSettings = { homedir: tmpDir };
    hexletDir = path.join(tmpDir, 'learning', 'Hexlet');
    params = { ...args, hexletDir };
  });

  it('init without local config', async () => {
    enableInterceptors();
    const result = await command.handler(params, customSettings);

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
    enableInterceptors();
    const result = await command.handler(params, customSettings);

    const actualConfig = await fse.readJson(result.hexletConfigPath);
    const expectedConfig = await fse.readJson(getFixturePath('config.json'));
    expectedConfig.hexletDir = hexletDir;
    expect(actualConfig).toEqual(expectedConfig);

    const validate = getValidator('assignments');
    expect(validate(actualConfig)).toBeTruthy();

    expect(await readDirP(hexletDir)).toMatchSnapshot();
  });

  it('init with existing repository & init again after changes', async () => {
    enableInterceptors({ remoteRepoExist: true });
    const result = await command.handler(params, customSettings);

    const actualConfig = await fse.readJson(result.hexletConfigPath);
    const expectedConfig = await fse.readJson(getFixturePath('assignmentsConfig.json'));
    expectedConfig.hexletDir = hexletDir;
    expectedConfig.assignments.githubUrl = `${baseUrl}/assignments-20`;
    expect(actualConfig).toEqual(expectedConfig);

    const validate = getValidator('assignments');
    expect(validate(actualConfig)).toBeTruthy();

    expect(await readDirP(hexletDir)).toMatchSnapshot();

    const { generateRepoPath, author } = initSettings(customSettings);
    const repoPath = generateRepoPath(hexletDir);
    const addedFileRelativePath = path.join('basics-course', 'example', 'addedFile');
    const addedFilePath = path.join(repoPath, addedFileRelativePath);
    await fse.outputFile(addedFilePath, 'content');
    await git.add({ dir: repoPath, filepath: addedFileRelativePath });
    await git.commit({ dir: repoPath, author, message: 'local commit' });

    enableInterceptors({ remoteRepoExist: true });
    await command.handler(params, customSettings);
    expect(await readDirP(hexletDir)).toMatchSnapshot();
  });
});
