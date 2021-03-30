#!/usr/bin/env node
// @ts-check

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const obj = yargs(hideBin(process.argv));
// eslint-disable-next-line no-unused-expressions
obj.commandDir('../src/commands')
  .demandCommand()
  .strict()
  .help()
  .argv;
