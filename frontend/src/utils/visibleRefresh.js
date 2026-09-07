// Keep an open workspace current when another user changes its records.
export const startVisibleRefresh = (refresh, intervalMs = 15000) => {
  let refreshing = false;
  const run = async () => {
    if (document.visibilityState === 'hidden' || refreshing) return;
    refreshing = true;
    try {
      await refresh();
    } finally {
      refreshing = false;
    }
  };
  const onRefresh = () => { run().catch(() => {}); };
  const timer = window.setInterval(onRefresh, intervalMs);
  window.addEventListener('focus', onRefresh);
  document.addEventListener('visibilitychange', onRefresh);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener('focus', onRefresh);
    document.removeEventListener('visibilitychange', onRefresh);
  };
};
