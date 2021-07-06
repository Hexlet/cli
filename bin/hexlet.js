#!/usr/bin/env node
// @ts-check

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const chalk = require('chalk');
const semver = require('semver');

const { isRoot, checkVersion } = require('../src/utils.js');

if (isRoot()) {
  throw new Error(chalk.red("Current user is root. Don't use sudo for running hexlet/cli"));
}

if (semver.lt(process.versions.node, '14.0.0')) {
  throw new Error('You need at least Node v14 to work with @hexlet/cli');
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
