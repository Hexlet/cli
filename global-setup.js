// eslint-disable-next-line
const { setup: setupDevServer } = require('jest-dev-server');

module.exports = async () => {
  await setupDevServer({
    command: 'GIT_HTTP_MOCK_SERVER_PORT=8888 GIT_HTTP_MOCK_SERVER_ROOT=__fixtures__/repos npx git-http-mock-server',
    launchTimeout: 5000,
    port: 8888,
  });
};
