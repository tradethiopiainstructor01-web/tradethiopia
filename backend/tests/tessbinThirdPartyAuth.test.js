const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const tessbinController = require('../controllers/tessbinController');

const createResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const withApiKey = async (value, callback) => {
  const original = process.env.TESBINN_3RD_PARTY_API_KEY;
  if (value === undefined) delete process.env.TESBINN_3RD_PARTY_API_KEY;
  else process.env.TESBINN_3RD_PARTY_API_KEY = value;
  try {
    await callback();
  } finally {
    if (original === undefined) delete process.env.TESBINN_3RD_PARTY_API_KEY;
    else process.env.TESBINN_3RD_PARTY_API_KEY = original;
  }
};

test('reports missing Tessbinn credentials as an integration configuration error', async () => {
  await withApiKey(undefined, async () => {
    const response = createResponse();
    await tessbinController.getThirdPartyRegistrations({ query: {} }, response);
    assert.equal(response.statusCode, 502);
    assert.equal(response.body.code, 'TESBINN_API_KEY_MISSING');
  });
});

test('does not expose an upstream Tessbinn 401 as an application-authentication 401', async () => {
  const originalGet = axios.get;
  axios.get = async () => {
    const error = new Error('Request failed with status code 401');
    error.response = { status: 401 };
    throw error;
  };
  try {
    await withApiKey('test-key', async () => {
      const response = createResponse();
      await tessbinController.getThirdPartyApplications({ query: {} }, response);
      assert.equal(response.statusCode, 502);
      assert.equal(response.body.code, 'TESBINN_UPSTREAM_AUTH_FAILED');
    });
  } finally {
    axios.get = originalGet;
  }
});

test('sends a configured key only in the upstream x-api-key header', async () => {
  const originalGet = axios.get;
  let receivedConfig;
  axios.get = async (_url, config) => {
    receivedConfig = config;
    return { data: { success: true, courses: [] } };
  };
  try {
    await withApiKey('test-key', async () => {
      const response = createResponse();
      await tessbinController.getThirdPartyCoursesBreakdown({ query: {} }, response);
      assert.equal(response.statusCode, 200);
      assert.equal(response.body.success, true);
      assert.equal(receivedConfig.headers['x-api-key'], 'test-key');
      assert.equal(receivedConfig.params, undefined);
    });
  } finally {
    axios.get = originalGet;
  }
});
