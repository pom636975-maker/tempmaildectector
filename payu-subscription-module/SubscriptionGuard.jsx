import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Ensure this matches your project structure

export default function SubscriptionGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkSubscriptionStatus();
  }, [location.pathname]);

  const checkSubscriptionStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // If no user, they are not logged in. Let the Auth guard handle this.
      if (!user) {
        setIsAuthorized(true);
        setLoading(false);
        return;
      }

      // Check the latest subscription for this shop/user
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('status, expires_at')
        // Replace with your logic to get the correct shop's subscription
        .eq('shop_id', user.id) 
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        // Log the error but don't crash, PGRST116 is "No rows found"
        console.error("Error fetching subscription status:", error);
      }

      const isExpired = !subscription || 
                        subscription.status !== 'active' || 
                        new Date(subscription.expires_at) < new Date();

      if (isExpired) {
        // Redirect to subscription page if they are not already there
        if (location.pathname !== '/subscription') {
          navigate('/subscription');
        } else {
          setIsAuthorized(true); // Allow them to view the subscription page
        }
      } else {
        setIsAuthorized(true); // Subscription is active
      }
    } catch (err) {
      console.error("Subscription guard error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return isAuthorized ? children : null;
}
