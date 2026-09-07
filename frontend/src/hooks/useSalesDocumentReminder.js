import { useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import axios from '../services/axiosInstance';
import { startVisibleRefresh } from '../utils/visibleRefresh';

export default function useSalesDocumentReminder() {
  const toast = useToast();
  useEffect(() => {
    let active = true;
    let pending = false;
    const id = 'sales-document-reminder';
    const remind = async () => {
      if (pending) return;
      pending = true;
      try {
        const { data } = await axios.get('/sales-customers/document-reminders', { timeout: 15000 });
        if (!active) return;
        if (!data.total) { toast.close(id); return; }
        const message = {
          title: `Documents needed for ${data.total} completed follow-up${data.total === 1 ? '' : 's'}`,
          description: data.items.map((item) => `${item.customerName}: ${item.missingDocuments.join(', ')}`).join('; ') +
            (data.total > data.items.length ? '. Open completed follow-ups to review the remaining records.' : '. Open the completed follow-up to upload these documents.'),
          status: 'warning', duration: 15000, isClosable: true, position: 'top-right',
        };
        if (toast.isActive(id)) toast.update(id, message);
        else toast({ id, ...message });
      } catch {
        // A reminder lookup should not interrupt sales work.
      } finally { pending = false; }
    };
    remind();
    window.addEventListener('sales:new-followup', remind);
    const stopRefresh = startVisibleRefresh(remind, 300000);
    return () => {
      active = false;
      window.removeEventListener('sales:new-followup', remind);
      stopRefresh();
      toast.close(id);
    };
  }, [toast]);
}
