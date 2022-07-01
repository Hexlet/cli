// @ts-check

const programSchema = {
  type: 'object',
  properties: {
    gitlabUrl: { type: 'string', minLength: 1 },
    gitlabGroupId: { type: 'string', minLength: 1 },
  },
  required: ['gitlabUrl', 'gitlabGroupId'],
  additionalProperties: false,
};

const programsSchema = {
  type: 'object',
  patternProperties: {
    '^[\\w-]+$': programSchema,
  },
  minProperties: 1,
  additionalProperties: false,
};

module.exports = {
  type: 'object',
  properties: {
    hexletUserId: { type: 'string', minLength: 1 },
    gitlabToken: { type: 'string', minLength: 1 },
    hexletDir: { type: 'string', minLength: 1 },
    programs: programsSchema,
  },
  required: ['hexletUserId', 'gitlabToken', 'hexletDir'],
  additionalProperties: true,
};
