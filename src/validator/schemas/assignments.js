// @ts-check

const assignmentsSchema = {
  type: 'object',
  patternProperties: {
    githubUrl: { type: 'string', minLength: 1 },
  },
  required: ['githubUrl'],
  additionalProperties: false,
};

module.exports = {
  type: 'object',
  properties: {
    hexletToken: { type: 'string', minLength: 1 },
    githubToken: { type: 'string', minLength: 1 },
    hexletDir: { type: 'string', minLength: 1 },
    assignments: assignmentsSchema,
  },
  required: ['hexletToken', 'githubToken', 'hexletDir', 'assignments'],
  additionalProperties: true,
};
