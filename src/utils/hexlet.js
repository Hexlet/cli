// @ts-check

const fsp = require('fs/promises');
const axios = require('axios');
const debug = require('debug');

const log = debug('hexlet');

const downloadAssignment = async (options) => {
  const {
    courseSlug, lessonSlug, filePath, hexletToken, apiHost, refresh = false,
  } = options;

  const method = refresh ? 'put' : 'post';
  const url = `${apiHost}/api/course/${courseSlug}/lesson/${lessonSlug}/assignment/download`;
  const handledStatuses = [200, 201, 404, 401, 422];

  log('download', filePath);
  const response = await axios({
    method,
    url,
    headers: { 'X-Auth-Key': hexletToken },
    responseType: 'arraybuffer',
    validateStatus: (status) => handledStatuses.includes(status),
  });

  const { status } = response;

  if (status === 404) {
    throw new Error(`Assignment ${courseSlug}/${lessonSlug} not found. Check the lessonUrl.`);
  }
  if (status === 401 || status === 422) {
    const dataJson = response.data.toString();
    let data;
    try {
      data = JSON.parse(dataJson);
    } catch (e) {
      data = { message: 'Unknown' };
    }
    const { message } = data;
    throw new Error(message);
  }

  await fsp.writeFile(filePath, response.data);
};

module.exports = {
  downloadAssignment,
};
