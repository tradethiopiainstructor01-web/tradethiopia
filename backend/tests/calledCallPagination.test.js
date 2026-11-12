const assert = require('node:assert/strict');
const { test } = require('node:test');
const CalledCall = require('../models/CalledCall');
const { getCalledCalls } = require('../controllers/calledCallController');

async function fetchPage(t, query, total) {
  const captured = {};
  let countCalls = 0;
  t.mock.method(CalledCall, 'countDocuments', async () => countCalls++ === 0 ? total : 0);
  t.mock.method(CalledCall, 'aggregate', async () => []);
  t.mock.method(CalledCall, 'find', (filter) => {
    captured.filter = filter;
    const chain = {
      populate: () => chain,
      sort: (value) => { captured.sort = value; return chain; },
      skip: (value) => { captured.skip = value; return chain; },
      limit: (value) => { captured.limit = value; return chain; },
      lean: async () => [],
    };
    return chain;
  });
  const res = {
    status(code) { captured.status = code; return this; },
    json(body) { captured.body = body; return this; },
  };
  await getCalledCalls({ query, user: { _id: 'sales-user', role: 'sales' } }, res);
  assert.equal(captured.status, 200);
  return captured;
}

test('page 2 reaches records beyond the first 50, retaining ownership and stable sorting', async (t) => {
  const result = await fetchPage(t, { page: '2', limit: '50' }, 125);
  assert.equal(result.skip, 50);
  assert.equal(result.limit, 50);
  assert.equal(result.filter.createdBy, 'sales-user');
  assert.deepEqual(result.sort, { callDate: -1, createdAt: -1, _id: -1 });
  assert.deepEqual(result.body.pagination, { page: 2, limit: 50, total: 125, totalPages: 3 });
});

test('deleting the last row of the last page clamps to the previous page', async (t) => {
  const result = await fetchPage(t, { page: '3', limit: '50' }, 100);
  assert.equal(result.body.pagination.page, 2);
  assert.equal(result.skip, 50);
});

test('date boundaries retain the browser timezone and filters apply before pagination', async (t) => {
  const dateFrom = '2026-11-11T21:00:00.000Z';
  const dateTo = '2026-11-12T20:59:59.999Z';
  const result = await fetchPage(t, { dateFrom, dateTo, details: 'needs_details', search: 'Abebe', page: '9' }, 0);
  assert.equal(result.filter.callDate.$gte.toISOString(), dateFrom);
  assert.equal(result.filter.callDate.$lte.toISOString(), dateTo);
  assert.equal(result.filter.$and.length, 2);
  assert.equal(result.body.pagination.page, 1);
  assert.equal(result.body.pagination.total, 0);
  assert.equal(result.skip, 0);
});
