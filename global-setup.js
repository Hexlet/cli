// eslint-disable-next-line
const { setup: setupDevServer } = require('jest-dev-server');
const path = require('path');
const os = require('os');

const port = '8888';
const reposPath = path.join('__fixtures__', 'repos');
const command = os.platform() === 'win32'
  ? `pwsh -command "$env:GIT_HTTP_MOCK_SERVER_PORT='${port}'; $env:GIT_HTTP_MOCK_SERVER_ROOT='${reposPath}'; npx git-http-mock-server"`
  : `GIT_HTTP_MOCK_SERVER_PORT=${port} GIT_HTTP_MOCK_SERVER_ROOT=${reposPath} npx git-http-mock-server`;

module.exports = async () => {
  await setupDevServer({
    command,
    launchTimeout: 20000,
    port: 8888,
    waitOnScheme: {
      delay: 1000,
    },
  });
};
