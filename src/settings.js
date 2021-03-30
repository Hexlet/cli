// @ts-check

const os = require('os');
const path = require('path');

module.exports = (options = {}) => {
  const homeDir = options.homedir || os.homedir();
  const hexletDir = path.join(homeDir, 'Hexlet');
  const cliSrcDir = path.join(__dirname, '..', 'src');
  const hexletConfigPath = path.join(hexletDir, '.config');
  const hexletTemplatesPath = path.join(cliSrcDir, 'templates');
  const hexletGitlabNamespace = 'hexlethq'; // https://gitlab.com/hexlethq
  const branch = 'main';
  const generateHexletProgramPath = (programSlug) => path.join(hexletDir, programSlug);

  return {
    cliSrcDir,
    hexletConfigPath,
    hexletDir,
    hexletGitlabNamespace,
    branch,
    hexletTemplatesPath,
    generateHexletProgramPath,
  };
};
