const mongoose = require('mongoose');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableTransactionError = (error) => {
  if (!error) return false;
  if (typeof error.hasErrorLabel === 'function') {
    if (error.hasErrorLabel('TransientTransactionError')) return true;
  }
  return (
    error.code === 112 ||
    error.codeName === 'WriteConflict' ||
    /write conflict|TransientTransactionError|UnknownTransactionCommitResult|yielding is disabled/i.test(error.message || '')
  );
};

const runTransaction = async (work, options = {}) => {
  const maxRetries = Number.isInteger(options.maxRetries) ? options.maxRetries : 3;
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const session = await mongoose.startSession();
    try {
      let result;
      await session.withTransaction(async () => {
        result = await work(session);
      }, {
        readPreference: 'primary',
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' }
      });
      return result;
    } catch (error) {
      lastError = error;
      if (attempt >= maxRetries || !isRetryableTransactionError(error)) {
        throw error;
      }
      await sleep(50 * (attempt + 1));
    } finally {
      session.endSession();
    }
  }

  throw lastError;
};

module.exports = {
  isRetryableTransactionError,
  runTransaction
};
