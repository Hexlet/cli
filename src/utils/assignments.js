// @ts-check

const { URL } = require('url');
const _ = require('lodash');
const moment = require('moment');
const fse = require('fs-extra');
const path = require('path');

const isValidLessonUrl = (lessonUrl) => {
  const urlRegExp = /^https:\/\/\w{0,2}\.*hexlet.io\/courses\/.+\/lessons\/[^/]+/;
  return urlRegExp.test(lessonUrl);
};

const checkLessonUrl = (lessonUrl) => {
  if (!isValidLessonUrl(lessonUrl)) {
    throw new Error('Incorrect lessonUrl.');
  }
};

const getLessonData = (lessonUrl) => {
  const url = new URL(lessonUrl);
  const hostParts = !url.host.startsWith('hexlet') ? url.host.split('.') : ['en'];
  const [locale] = hostParts;
  const lessonPath = url.pathname.replace('/', '');
  const pathParts = lessonPath.split('/');
  const [courseSlug, lessonSlug] = _.without(pathParts, 'courses', 'lessons');

  return {
    apiHost: url.origin,
    courseSlug,
    lessonSlug,
    locale,
  };
};

const generateAssignmentPath = (repoPath, courseSlug, lessonSlug, locale) => {
  const courseSlugWithLocale = locale === 'en' ? courseSlug : `${courseSlug}-${locale}`;
  return path.join(repoPath, courseSlugWithLocale, lessonSlug);
};

const makeAssignmentBackup = async (assignmentPath) => {
  const dateTime = moment().format('DD.MM.YY_HH.mm.ss');
  const assignmentBackupPath = `${assignmentPath}_${dateTime}`;
  await fse.move(assignmentPath, assignmentBackupPath);
  return assignmentBackupPath;
};

const getAssignmentData = (cwdPath, repoPath) => {
  const { sep } = path;
  const regexp = new RegExp(`${repoPath}${sep}(?<courseSlugWithLocale>[^/]+)${sep}(?<lessonSlug>[^/]+).*$`);
  const validAssignmentPath = regexp.test(cwdPath);

  if (!validAssignmentPath) {
    throw new Error('Submit command must be executed from assignment directory.');
  }

  const matches = cwdPath.match(regexp);
  return matches.groups;
};

module.exports = {
  getLessonData,
  makeAssignmentBackup,
  isValidLessonUrl,
  checkLessonUrl,
  getAssignmentData,
  generateAssignmentPath,
};
