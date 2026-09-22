import { createElement, useEffect, useRef, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import DocumentReminderToast from '../components/sales/DocumentReminderToast';
import axios from '../services/axiosInstance';
import { startVisibleRefresh } from '../utils/visibleRefresh';

export default function useSalesDocumentReminder() {
  const [reminder, setReminder] = useState({ total: 0, items: [] });
  const toast = useToast();
  const lastShownSignature = useRef('');

  useEffect(() => {
    const id = 'sales-document-reminder';
    if (!reminder.total) {
      toast.close(id);
      lastShownSignature.current = '';
      return;
    }
    const signature = JSON.stringify(reminder);
    if (signature === lastShownSignature.current) return;
    lastShownSignature.current = signature;
    const message = {
      duration: null,
      position: 'top-right',
      containerStyle: { width: '420px', maxWidth: 'calc(100vw - 24px)' },
      render: () => createElement(DocumentReminderToast, {
        ...reminder,
        onDismiss: () => toast.close(id),
      }),
    };
    if (toast.isActive(id)) toast.update(id, message);
    else toast({ id, ...message });
  }, [reminder, toast]);

  useEffect(() => () => toast.close('sales-document-reminder'), [toast]);

  useEffect(() => {
    let active = true;
    let pending = false;
    let refreshAgain = false;
    const refresh = async () => {
      if (pending) { refreshAgain = true; return; }
      pending = true;
      try {
        const { data } = await axios.get('/sales-customers/document-reminders', { timeout: 15000 });
        if (active) setReminder({ total: Number(data.total) || 0, items: Array.isArray(data.items) ? data.items : [] });
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
