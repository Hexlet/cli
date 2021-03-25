// @ts-check

const os = require('os');
const path = require('path');

const homeDir = os.homedir();
const hexletDir = path.join(homeDir, 'Hexlet');
const cliSrcDir = path.join(__dirname, '..', 'src');
const hexletConfigPath = path.join(hexletDir, '.config');
const hexletGitlabNamespace = 'hexlethq'; // https://gitlab.com/hexlethq
const branch = 'main';

module.exports = {
  cliSrcDir, hexletConfigPath, hexletDir, hexletGitlabNamespace, branch,
};
