// @ts-check

const _ = require('lodash');

const getEntityName = (params) => {
  const commandParts = _.get(params, '_');
  return _.first(commandParts);
};

module.exports = {
  getEntityName,
};
