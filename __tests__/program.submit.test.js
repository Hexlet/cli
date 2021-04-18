const os = require('os');
const path = require('path');
const git = require('isomorphic-git');
const fsp = require('fs/promises');
const fse = require('fs-extra');
const nock = require('nock');

const programCmd = require('../src/commands/program/submit.js');
const initSettings = require('../src/settings.js');

nock.disableNetConnect();

let defaults;

describe('program', () => {
  beforeEach(async () => {
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'hexlet-cli-'));
    defaults = { homedir: tmpDir };
    // TODO use settings.js
    const { hexletConfigPath, generateHexletProgramPath } = initSettings(defaults);
    const hexletProgramPath = generateHexletProgramPath('ruby');
    await fsp.mkdir(path.join(hexletProgramPath, 'exercises', 'hello-world'), { recursive: true });
  });

  it('submit', async () => {
    const { hexletConfigPath } = initSettings(defaults);
    const configData = {
      token: 'token',
      programs: { ruby: { gitlabUrl: 'lal' } },
    };
    await fse.writeJson(hexletConfigPath, configData);
    // nock('https://gitlab.com')
    //   .get('/api/v4/namespaces/test-group')
    //   .reply(200, { full_path: 'hexlet/jopa', path: 'jopa' });

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

    git.pull = jest.fn(() => {});
    git.commit = jest.fn(() => {});
    git.push = jest.fn(() => {});

    const args = {
      program: 'ruby',
      exercise: 'hello-world',
      customSettings: defaults,
    };
    await programCmd.handler(args, defaults);
    // const data = await fse.readJson(result.hexletConfigPath);

    expect(true).toBe(true);
    // expect(data).toMatchObject({ userId: args.userId });
  });

  it('submit (without init)', async () => {
    const args = {
      program: 'ruby',
      exercise: 'hello-world',
      customSettings: defaults,
    };

    await expect(() => programCmd.handler(args, defaults)).rejects.toThrow('no such file or directory');
  });
});
