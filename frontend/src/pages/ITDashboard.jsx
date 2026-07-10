import React from 'react';
import ITLayout from '../components/it/ITLayout';

const ITDashboard = ({ initialTab = 'dashboard' }) => {
  return <ITLayout initialTab={initialTab} />;
};

export default ITDashboard;
