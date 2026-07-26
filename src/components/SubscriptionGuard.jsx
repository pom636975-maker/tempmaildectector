import React from 'react';
import { Navigate } from 'react-router-dom';

export default function SubscriptionGuard({ children }) {
  // Add InsForge API checks here to ensure the user has an active subscription.
  // For now, it passes through to allow development.
  
  // if (userHasNoActiveSubscription) {
  //   return <Navigate to="/subscription" replace />;
  // }
  
  return <>{children}</>;
}
