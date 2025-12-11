import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RedirectMessagesPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Get the referrer to determine which dashboard the user came from
    const referrer = document.referrer;
    
    // Check if the user came from a specific dashboard
    if (referrer.includes('/sdashboard') || referrer.includes('/sales')) {
      navigate('/sales/messages');
    } else if (referrer.includes('/finance-dashboard') || referrer.includes('/finance')) {
      navigate('/finance/messages');
    } else if (referrer.includes('/it') || referrer.includes('/ITDashboard')) {
      navigate('/it/messages');
    } else if (referrer.includes('/cdashboard') || referrer.includes('/customer')) {
      navigate('/customer/messages');
    } else {
      // Default to sales messages if we can't determine the source
      navigate('/sales/messages');
    }
  }, [navigate]);

  return (
    <div>
      <p>Redirecting to the appropriate message board...</p>
    </div>
  );
};

export default RedirectMessagesPage;