const SESSION_AUTH_ERROR_CODES = new Set([
  'AUTH_TOKEN_MISSING',
  'AUTH_TOKEN_INVALID',
  'AUTH_USER_NOT_FOUND',
]);

const SESSION_AUTH_MESSAGES = new Set([
  'not authorized, no token',
  'not authorized, token failed',
  'not authorized, user not found',
  'not authorized, please log in.',
  'not authenticated',
  'authentication required',
]);

const isLoginRequest = (url = '') => {
  const requestPath = String(url).split('?')[0].replace(/\/+$/, '');
  return requestPath.endsWith('/users/login');
};

export const isSessionAuthenticationError = (error) => {
  if (error?.response?.status !== 401 || isLoginRequest(error?.config?.url)) {
    return false;
  }

  const responseData = error?.response?.data;
  const code = typeof responseData?.code === 'string' ? responseData.code.trim() : '';
  if (SESSION_AUTH_ERROR_CODES.has(code)) {
    return true;
  }

  const message = typeof responseData?.message === 'string'
    ? responseData.message.trim().toLowerCase()
    : '';

  return SESSION_AUTH_MESSAGES.has(message);
};
