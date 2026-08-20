import test from 'node:test';
import assert from 'node:assert/strict';
import { isSessionAuthenticationError } from '../src/utils/authErrors.js';

test('does not clear the session for invalid login credentials', () => {
  assert.equal(isSessionAuthenticationError({
    config: { url: '/users/login' },
    response: { status: 401, data: { message: 'Invalid email or password' } },
  }), false);
});

test('does not clear the session for a third-party integration 401', () => {
  assert.equal(isSessionAuthenticationError({
    config: { url: '/tessbin/third-party/summary' },
    response: { status: 401, data: { message: 'Failed to fetch 3rd party summary' } },
  }), false);
});

test('clears the session for an invalid application token', () => {
  assert.equal(isSessionAuthenticationError({
    config: { url: '/users/me' },
    response: { status: 401, data: { code: 'AUTH_TOKEN_INVALID' } },
  }), true);
});

test('supports token-authentication messages from older backend deployments', () => {
  assert.equal(isSessionAuthenticationError({
    config: { url: '/users/me' },
    response: { status: 401, data: { message: 'Not authorized, token failed' } },
  }), true);
});
