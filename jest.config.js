module.exports = {
  testEnvironment: 'node',
  modulePathIgnorePatterns: [
    '<rootDir>/__tests__/helpers',
  ],
  globalSetup: '<rootDir>/global-setup.js',
  globalTeardown: '<rootDir>/global-teardown.js',
};
