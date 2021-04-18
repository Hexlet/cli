#!/usr/bin/env node
// @ts-check

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const chalk = require('chalk');

const { isRoot } = require('../src/utils.js');

if (isRoot()) {
  throw new Error(chalk.red('Current user is root. Dont use sudo for running hexlet/cli'));
}

console.log();

const obj = yargs(hideBin(process.argv));
// eslint-disable-next-line no-unused-expressions
obj.commandDir('../src/commands')
  .demandCommand()
  .strict()
  .help()
  .argv;
