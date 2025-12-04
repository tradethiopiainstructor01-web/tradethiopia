import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserStore } from '../../store/user';

const SalesManagerProtectedRoute = ({ children }) => {
  const currentUser = useUserStore((state) => state.currentUser);
  
  // Check if user is a sales manager
  if (!currentUser || currentUser.role !== 'salesmanager') {
    // Redirect to login or unauthorized page
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default SalesManagerProtectedRoute;