import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../../store/user';

const SalesManagerProtectedRoute = ({ children }) => {
  const currentUser = useUserStore((state) => state.currentUser);
  const location = useLocation();

  // Normalize role and also check localStorage for fallback
  const storedRole =
    (typeof localStorage !== 'undefined' && localStorage.getItem('userRole')) || '';
  const normalizedRole = (currentUser?.role || storedRole || '')
    .toString()
    .trim()
    .toLowerCase();

  console.log('dY"? SalesManagerProtectedRoute Check:');
  console.log('  - Current User:', currentUser);
  console.log('  - Stored Role:', storedRole);
  console.log('  - Normalized Role:', normalizedRole);
  console.log('  - Is Sales Manager?', normalizedRole === 'salesmanager');

  if (normalizedRole !== 'salesmanager') {
    console.warn('ƒ?O Access Denied - Not a sales manager');
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  console.log('ƒo. Access Granted - Rendering protected content');
  return children;
};

export default SalesManagerProtectedRoute;
