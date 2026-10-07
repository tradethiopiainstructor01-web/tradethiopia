import { useEffect, useRef, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import axios from '../services/axiosInstance';
import { startVisibleRefresh } from '../utils/visibleRefresh';

const ADD_CUSTOMER_TOAST_ID = 'sales-add-customer-document-warning';

// Loads the agent's completed sales that are missing a payment slip, for the
// navbar reminder and the short warning shown when a new follow-up is started.
export default function useSalesDocumentReminder() {
  const [reminder, setReminder] = useState({ total: 0, items: [] });
  const latestTotal = useRef(0);
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
  return reminder;
}
