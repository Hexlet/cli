// @ts-check

const { Octokit } = require('@octokit/rest');
const sodium = require('libsodium-wrappers');

const checkToken = async ({ token }) => {
  const octokit = new Octokit({ auth: token });

  try {
    const { headers } = await octokit.request();
    const scopes = headers['x-oauth-scopes'];
    if (!scopes.includes('repo') || !scopes.includes('workflow')) {
      throw new Error('Github token must have public_repo permission');
    }
  } catch (e) {
    if (e.status === 401) {
      throw new Error('Check your github token');
    }
    throw e;
  }
};

const getOwner = async ({ token }) => {
  const octokit = new Octokit({ auth: token });
  const response = await octokit.rest.users.getAuthenticated();
  return response.data.login;
};

const setRepoSecret = async (options) => {
  const {
    token, owner, repo, name, value,
  } = options;

  const octokit = new Octokit({ auth: token });

  const { data: keyData } = await octokit.rest.actions.getRepoPublicKey({
    owner,
    repo,
  });

  await sodium.ready;

  const keyBytes = sodium.from_base64(keyData.key, sodium.base64_variants.ORIGINAL);
  const valueBytes = sodium.from_string(value);
  const valueEncryptedBytes = sodium.crypto_box_seal(valueBytes, keyBytes);
  const valueEncrypted = sodium.to_base64(valueEncryptedBytes, sodium.base64_variants.ORIGINAL);

  await octokit.rest.actions.createOrUpdateRepoSecret({
    owner,
    repo,
    secret_name: name,
    encrypted_value: valueEncrypted,
    key_id: keyData.key_id,
  });
};

const branchExists = async (options) => {
  const {
    owner, repo, branch, token,
  } = options;

  const octokit = new Octokit({ auth: token });

  try {
    await octokit.rest.repos.getBranch({ owner, repo, branch });
    return true;
  } catch (e) {
    if (e.status === 404) {
      return false;
    }
    throw e;
  }
};

module.exports = {
  checkToken,
  getOwner,
  setRepoSecret,
  branchExists,
};
