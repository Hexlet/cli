// @ts-check

const os = require('os');
const path = require('path');

module.exports = (options = {}) => {
  const homeDir = options.homedir || os.homedir();
  const hexletConfigDir = path.join(homeDir, 'Hexlet');
  const cliSrcDir = path.join(__dirname, '..', 'src');
  const hexletConfigPath = path.join(hexletConfigDir, '.config.json');
  const hexletTemplatesPath = path.join(cliSrcDir, 'templates');
  const hexletGitlabNamespace = 'hexlethq'; // https://gitlab.com/hexlethq
  const branch = 'main';
  const generateHexletProgramPath = (hexletDir, programSlug) => path.join(hexletDir, programSlug);
  const author = {
    name: '@hexlet/cli',
    email: 'support@hexlet.io',
  };

  return {
    author,
    cliSrcDir,
    hexletConfigDir,
    hexletConfigPath,
    hexletGitlabNamespace,
    branch,
    hexletTemplatesPath,
    generateHexletProgramPath,
  };
};
