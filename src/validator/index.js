// @ts-check

const Ajv = require('ajv');

const programSchema = require('./schemas/program.js');
const assignmentsSchema = require('./schemas/assignments.js');

const getConfigSchema = (schemaName) => {
  switch (schemaName) {
    case 'program':
      return programSchema;
    case 'assignments':
      return assignmentsSchema;
    case 'assignment':
      return assignmentsSchema;
    default:
      throw new Error('Schema name not specified');
  }
};

module.exports.getValidator = (schemaName) => {
  const ajv = new Ajv();
  return ajv.compile(getConfigSchema(schemaName));
};
