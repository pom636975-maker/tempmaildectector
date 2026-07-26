import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Ensure this path matches your project structure

export default function Subscription() {
  const [loading, setLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Setup Fee & Monthly Subscription as per requirements
  const setupFee = 4000;
  const monthlyFee = 1200;
  const planName = "Jewellery SaaS Monthly Plan";

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Assuming you have a way to get the shop_id for the user, 
      // here we just fetch the latest subscription for this user/shop.
      // You should adjust this query based on your tenant structure.
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setCurrentSubscription(data);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setFetchLoading(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Replace this with actual shop_id from your context
      const shopId = user.id; 

      // 2. Generate Unique Transaction ID
      const txnid = "TXN_" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000);

      // 3. Call secure backend endpoint to generate PayU Hash
      const response = await fetch('https://<PROJECT_REF>.supabase.co/functions/v1/payu-backend-function/generate-hash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          txnid: txnid,
          amount: monthlyFee.toString(),
          productinfo: planName,
          firstname: user.user_metadata?.first_name || 'Customer',
          email: user.email,
          udf1: shopId, // Passing shop_id in udf1
        }),
      });

      const { hash, key } = await response.json();

      if (!hash || !key) {
        throw new Error("Failed to generate payment hash");
      }

      // 4. Create form dynamically to redirect to PayU Hosted Checkout
      const form = document.createElement('form');
      // For Test Mode: https://test.payu.in/_payment
      // For Prod Mode: https://secure.payu.in/_payment
      form.action = 'https://test.payu.in/_payment';
      form.method = 'POST';

      const appendInput = (name, value) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      };

      appendInput('key', key);
      appendInput('txnid', txnid);
      appendInput('amount', monthlyFee.toString());
      appendInput('productinfo', planName);
      appendInput('firstname', user.user_metadata?.first_name || 'Customer');
      appendInput('email', user.email);
      appendInput('phone', user.user_metadata?.phone || '0000000000');
      
      // Pass shop_id in udf1 so the backend webhook knows which shop this payment is for
      appendInput('udf1', shopId); 

      appendInput('surl', 'https://<PROJECT_REF>.supabase.co/functions/v1/payu-backend-function/payment-callback');
      appendInput('furl', 'https://<PROJECT_REF>.supabase.co/functions/v1/payu-backend-function/payment-callback');
      appendInput('hash', hash);

      document.body.appendChild(form);
      form.submit();

    } catch (error) {
      console.error("Payment initiation failed", error);
      alert("Failed to initiate payment. Please try again.");
      setLoading(false);
    }
  };

  const isExpired = currentSubscription?.status !== 'active' || new Date(currentSubscription?.expires_at) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Subscription Management
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900">Current Plan</h3>
            {fetchLoading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : currentSubscription ? (
              <div className="mt-2 text-sm text-gray-600">
                <p>Status: <span className={`font-bold ${isExpired ? 'text-red-600' : 'text-green-600'}`}>{isExpired ? 'Expired' : 'Active'}</span></p>
                <p>Expires At: {new Date(currentSubscription.expires_at).toLocaleDateString()}</p>
                <p>Plan: {currentSubscription.plan}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">No active subscription found.</p>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Available Plans</h3>
            <div className="border border-indigo-200 rounded-lg p-4 bg-indigo-50">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-indigo-900">Monthly Plan</span>
                <span className="text-indigo-700 font-bold">₹{monthlyFee}/month</span>
              </div>
              <p className="text-sm text-indigo-600 mb-4">
                Note: A one-time setup fee of ₹{setupFee} may apply to new installations.
              </p>
              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Processing...' : (isExpired ? 'Renew Now' : 'Pay Now')}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
