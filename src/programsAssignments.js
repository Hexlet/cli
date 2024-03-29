// @ts-check

const makeData = (courseSlug, lessonSlug) => ({ courseSlug, lessonSlug });

const java = {
  lists: makeData('java-collections', 'lists'),
  maps: makeData('java-collections', 'maps'),
  generics: makeData('java-collections', 'generics'),
  tests: makeData('java-collections', 'tests'),
  streams: makeData('java-collections', 'streams'),
  lambdas: makeData('java-collections', 'lambdas'),
  'advanced-streams': makeData('java-collections', 'advanced-streams'),
  'other-collections': makeData('java-collections', 'other-collections'),
  'classes-and-objects': makeData('java-oop', 'classes-and-objects'),
  interfaces: makeData('java-oop', 'interfaces'),
  subtyping: makeData('java-oop', 'subtyping'),
  patterns: makeData('java-oop', 'patterns'),
  inheritance: makeData('java-oop', 'inheritance'),
  errors: makeData('java-oop', 'errors'),
  reflections: makeData('java-oop', 'reflections'),
  'code-generation': makeData('java-oop', 'code-generation'),
  http: makeData('java-web', 'http'),
  servlet: makeData('java-web', 'servlet'),
  deploy: makeData('java-web', 'deploy'),
  html: makeData('java-web', 'html'),
  templating: makeData('java-web', 'templating'),
  'crud-in-memory': makeData('java-web', 'crud-in-memory'),
  session: makeData('java-web', 'session'),
  logging: makeData('java-web', 'logging'),
  sql: makeData('java-web', 'sql'),
  jdbc: makeData('java-web', 'jdbc'),
  'crud-with-db': makeData('java-web', 'crud-in-db'),
  orm: makeData('java-web', 'orm'),
  javalin: makeData('java-web', 'javalin'),
  validation: makeData('java-web', 'validation'),
  'rest-api': makeData('java-web', 'rest-api'),
  'web-tests': makeData('java-web', 'tests'),
  'intro-to-spring': makeData('java-spring', 'intro-to-spring'),
  migrations: makeData('java-spring', 'migrations'),
  'spring-orm': makeData('java-spring', 'spring-orm'),
  'spring-tests': makeData('java-spring', 'spring-tests'),
  relations: makeData('java-spring', 'relations'),
  'finite-state-machine': makeData('java-spring', 'finite-state-machine'),
  trees: makeData('java-spring', 'trees'),
  'open-api': makeData('java-spring', 'open-api'),
  filtration: makeData('java-spring', 'filtration'),
  'nested-resources': makeData('java-spring', 'nested-resources'),
  authentication: makeData('java-spring', 'authentication'),
  authorization: makeData('java-spring', 'authorization'),
  'service-layer': makeData('java-spring', 'service-layer'),
  queues: makeData('java-spring', 'queues'),
  'spring-lifecycle': makeData('java-spring', 'spring-lifecycle'),
  'custom-annotations': makeData('java-spring', 'custom-annotations'),
  multithreading: makeData('java-advanced', 'multithreading'),
  'multithreading-java': makeData('java-advanced', 'multithreading-java'),
  'sync-primitives': makeData('java-advanced', 'sync-primitives'),
  asynchrony: makeData('java-advanced', 'asynchrony'),
  'multithreading-spring': makeData('java-advanced', 'multithreading-spring'),
  docker: makeData('java-advanced', 'docker'),
  'test-container': makeData('java-advanced', 'test-containers'),
};

const rails = {
  fundamentals: makeData('ruby-basics', 'basics'),
  collections: makeData('ruby-basics', 'collections'),
  'functional-programming': makeData('ruby-basics', 'functional-programming'),
  testing: makeData('ruby-basics', 'testing'),
  oop: makeData('ruby-basics', 'oop'),
  metaprogramming: makeData('ruby-basics', 'metaprogramming'),
  'gems-inside': makeData('ruby-setup-environment', 'gems-inside'),
  rack: makeData('rails-basics', 'rack'),
  'static-pages': makeData('rails-basics', 'static-pages'),
  models: makeData('rails-basics', 'models'),
  quality: makeData('rails-basics', 'quality'),
  crud: makeData('rails-basics', 'crud'),
  templates: makeData('rails-basics', 'templates'),
  forms: makeData('rails-basics', 'forms'),
  relations: makeData('rails-basics', 'relations'),
  'nested-resources': makeData('rails-basics', 'nested-resources'),
  webpacker: makeData('rails-basics', 'webpacker'),
  i18n: makeData('rails-basics', 'i18n'),
  middlewares: makeData('rails-basics', 'middlewares'),
  rake: makeData('rails-basics', 'rake'),
  security: makeData('rails-real', 'security'),
  'system-tests': makeData('rails-real', 'system-tests'),
  fsm: makeData('rails-real', 'fsm'),
  'search-forms': makeData('rails-real', 'search-forms'),
  'nested-forms': makeData('rails-real', 'nested-forms'),
  acl: makeData('rails-real', 'acl'),
  files: makeData('rails-real', 'files'),
  emails: makeData('rails-real', 'emails'),
  'controller-hierarchy': makeData('rails-real', 'controller-hierarchy'),
  api: makeData('rails-full', 'api'),
  jbuilder: makeData('rails-full', 'jbuilder'),
  streaming: makeData('rails-full', 'streaming'),
  'testing-2': makeData('rails-full', 'testing-2'),
  jobs: makeData('rails-full', 'jobs'),
  caching: makeData('rails-full', 'caching'),
  engines: makeData('rails-full', 'engines'),
};

module.exports = {
  java,
  rails,
  'devops-for-programmers': {},
  'frontend-testing-react': {},
};
