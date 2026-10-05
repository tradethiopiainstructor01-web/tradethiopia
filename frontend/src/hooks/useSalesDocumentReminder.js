import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import axios from '../services/axiosInstance';
import { startVisibleRefresh } from '../utils/visibleRefresh';

const REMIND_EVERY_MS = 5 * 60 * 1000;
const ADD_CUSTOMER_TOAST_ID = 'sales-add-customer-document-warning';

// Loads the agent's completed sales that are missing documents (or have only a
// placeholder) and decides when the full-screen warning (DocumentWarningOverlay)
// opens: when the workspace opens, whenever a new sale joins the list, and every
// 5 minutes after it is closed while anything is still missing. It closes on its
// own once every document is submitted.
export default function useSalesDocumentReminder() {
  const [reminder, setReminder] = useState({ total: 0, items: [] });
  const [isWarningOpen, setWarningOpen] = useState(false);
  const warnedTotal = useRef(0);
  const warnedNewestId = useRef('');
  const latestTotal = useRef(0);
  const refreshRef = useRef(async () => {});
  const hasMissing = reminder.total > 0;
  const toast = useToast();

  // Starting a new customer follow-up ('sales:new-followup') shows a short
  // 5-second warning while earlier sales still have missing documents.
  useEffect(() => {
    const warn = () => {
      const total = latestTotal.current;
      if (!total || toast.isActive(ADD_CUSTOMER_TOAST_ID)) return;
      toast({
        id: ADD_CUSTOMER_TOAST_ID,
        status: 'warning',
        position: 'top',
        duration: 5000,
        isClosable: true,
        title: `${total} completed sale${total === 1 ? ' is' : 's are'} missing a payment slip`,
        description: 'Submit the missing payment slips, otherwise your account will be locked or deactivated.',
      });
    };
    window.addEventListener('sales:new-followup', warn);
    return () => window.removeEventListener('sales:new-followup', warn);
  }, [toast]);

  // Re-check 5 minutes after the warning is closed; show it again if still missing.
  useEffect(() => {
    if (isWarningOpen || !hasMissing) return undefined;
    let active = true;
    const timer = window.setTimeout(async () => {
      await refreshRef.current();
      if (active && latestTotal.current > 0) setWarningOpen(true);
    }, REMIND_EVERY_MS);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isWarningOpen, hasMissing]);

  useEffect(() => {
    if (!reminder.total) {
      setWarningOpen(false);
      warnedTotal.current = 0;
      warnedNewestId.current = '';
      return;
    }
    // Items are the newest sales first (by ObjectId, which sorts by creation
    // time), limited to a few; an older sale sliding into the list is not new.
    const newestId = String(reminder.items[0]?._id || '');
    const hasNewSale = reminder.total > warnedTotal.current || newestId > warnedNewestId.current;
    warnedTotal.current = reminder.total;
    warnedNewestId.current = newestId;
    if (hasNewSale) setWarningOpen(true);
  }, [reminder]);

  const closeWarning = useCallback(() => setWarningOpen(false), []);

  useEffect(() => {
    let active = true;
    let pending = false;
    let refreshAgain = false;
    const refresh = async () => {
      if (pending) { refreshAgain = true; return; }
      pending = true;
      try {
        const { data } = await axios.get('/sales-customers/document-reminders', { timeout: 15000 });
        if (active) {
          latestTotal.current = Number(data.total) || 0;
          setReminder({ total: latestTotal.current, items: Array.isArray(data.items) ? data.items : [] });
        }
      } catch {
        // Keep the last successful result when a background refresh fails.
      } finally {
        pending = false;
        if (active && refreshAgain) { refreshAgain = false; void refresh(); }
      }
    };
    refreshRef.current = refresh;
    void refresh();
    window.addEventListener('sales:new-followup', refresh);
    window.addEventListener('sales:documents-updated', refresh);
    const stopRefresh = startVisibleRefresh(refresh, 300000);
    return () => {
      active = false;
      window.removeEventListener('sales:new-followup', refresh);
      window.removeEventListener('sales:documents-updated', refresh);
      stopRefresh();
    };
  }, []);
  return { ...reminder, isWarningOpen, closeWarning };
}
