// @ts-check

const fsp = require('fs/promises');
const axios = require('axios');

const downloadAssignment = async (options) => {
  const {
    courseSlug, lessonSlug, filePath, hexletToken, apiHost, reset = false,
  } = options;

  const method = reset ? 'put' : 'post';
  const url = `${apiHost}/api_internal/course/${courseSlug}/lesson/${lessonSlug}/assignment/download`;
  const handledStatuses = [200, 201, 404, 401, 403, 422];

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
  if ([401, 403, 422].includes(status)) {
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

const initAssignments = async ({ token, repoUrl }) => {
  const handledStatuses = [200, 404, 422];

  const response = await axios({
    method: 'put',
    url: 'https://hexlet.io/api_internal/user/assignments/init',
    data: { token, repository: repoUrl },
    validateStatus: (status) => handledStatuses.includes(status),
  });

  if (response.status === 404) {
    throw new Error('Invalid Hexlet token passed.');
  }
};

module.exports = {
  downloadAssignment,
  initAssignments,
};
