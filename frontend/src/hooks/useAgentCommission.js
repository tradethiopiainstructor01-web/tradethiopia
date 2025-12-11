import { useState, useEffect } from 'react';
import { getAgentCommissionByUsername } from '../services/salesManagerService';

/**
 * Custom hook to fetch agent commission by username
 * @param {string} username - The username to fetch commission for
 * @returns {Object} - Object containing commission data and loading/error states
 */
const useAgentCommission = (username) => {
  const [commission, setCommission] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCommission = async () => {
      if (!username) {
        setCommission(0);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const commissionValue = await getAgentCommissionByUsername(username);
        setCommission(commissionValue);
      } catch (err) {
        console.error('Error fetching agent commission:', err);
        setError(err.message || 'Failed to fetch commission data');
        setCommission(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCommission();
  }, [username]);

  return { commission, loading, error, setCommission };
};

export default useAgentCommission;