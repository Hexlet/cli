const os = require('os');

let globalSetup = '<rootDir>/global-setup.js';
let globalTeardown = '<rootDir>/global-teardown.js';
let winModulePathIgnorePatterns = [];

// TODO: git-http-mock-server don't work on windows
if (os.platform() === 'win32') {
  globalSetup = null;
  globalTeardown = null;
  winModulePathIgnorePatterns = ['<rootDir>/__tests__/program.submit.test.js'];
}

module.exports = {
  testEnvironment: 'node',
  modulePathIgnorePatterns: [
    '<rootDir>/__tests__/helpers',
    ...winModulePathIgnorePatterns,
  ],
  globalSetup,
  globalTeardown,
};
