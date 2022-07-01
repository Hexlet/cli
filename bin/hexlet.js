#!/usr/bin/env node
// @ts-check

const chalk = require('chalk');
const semver = require('semver');

if (semver.lt(process.versions.node, '14.0.0')) {
  throw new Error(chalk.red('You need at least Node v14 to work with @hexlet/cli'));
}

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const { isRoot, checkVersion } = require('../src/utils/cli.js');

if (isRoot()) {
  throw new Error(chalk.red("Current user is root. Don't use sudo for running hexlet/cli"));
}

checkVersion();

console.log();

const obj = yargs(hideBin(process.argv));
// eslint-disable-next-line no-unused-expressions
obj.commandDir('../src/commands')
  .demandCommand()
  .strict()
  .help()
  .parse();
