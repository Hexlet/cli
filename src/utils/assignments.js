// @ts-check

const { URL } = require('url');
const _ = require('lodash');
const moment = require('moment');
const fse = require('fs-extra');

const isValidLessonUrl = (lessonUrl) => {
  const urlRegExp = /^https:\/\/.{0,2}\.*hexlet.io\/courses\/.+\/lessons\/[^/.]+/;
  return urlRegExp.test(lessonUrl);
};

const checkLessonUrl = (lessonUrl) => {
  if (!isValidLessonUrl(lessonUrl)) {
    throw new Error('Incorrect lessonUrl');
  }
};

const getLessonData = (lessonUrl) => {
  const url = new URL(lessonUrl);
  const lessonPath = url.pathname.replace('/', '');
  const pathParts = lessonPath.split('/');
  const [courseSlug, lessonSlug] = _.without(pathParts, 'courses', 'lessons');

  return {
    apiHost: url.origin,
    courseSlug,
    lessonSlug,
  };
};

const makeAssignmentBackup = async (assignmentPath) => {
  const dateTime = moment().format('DD.MM.YY_HH.mm.ss');
  const assignmentBackupPath = `${assignmentPath}_${dateTime}`;
  await fse.move(assignmentPath, assignmentBackupPath);
  return assignmentBackupPath;
};

module.exports = {
  getLessonData,
  makeAssignmentBackup,
  isValidLessonUrl,
  checkLessonUrl,
};
