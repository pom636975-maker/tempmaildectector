import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createClient } from '@insforge/sdk';

const insforge = createClient({
  baseUrl: 'https://46d5hap4.us-east.insforge.app',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDY4Mjh9.SsIDVg7DZFXGLWYgPglCn0x1qVqK2PeQZQwgSarS7cA'
});

const CALLBACK_URL = 'https://46d5hap4.us-east.insforge.app/functions/payu-payment';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 1,
    period: 'month',
    description: 'Perfect for testing. Get started instantly!',
    features: ['Basic Dashboard Access', 'Up to 100 checks/month', 'Email Support'],
    badge: 'TRY NOW',
    badgeColor: 'bg-green-500',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 1200,
    period: 'month',
    description: 'For growing businesses with higher volume.',
    features: ['Full Dashboard Access', 'Up to 50,000 checks/month', 'Risk Scoring API', 'Priority Support'],
    badge: 'POPULAR',
    badgeColor: 'bg-indigo-500',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 4999,
    period: 'month',
    description: 'Enterprise-grade protection for serious teams.',
    features: ['Unlimited Dashboard', '200,000 checks/month', 'Advanced Analytics', 'Dedicated Support', 'Custom Rules'],
    badge: null,
    badgeColor: '',
  },
];

export default function Subscription() {
  const [loading, setLoading] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    setFetchLoading(false);
  };

  const handlePayment = async (plan) => {
    setLoading(plan.id);
    try {
      if (!user) throw new Error("User not authenticated");

      const shopId = user.id;
      const txnid = "TXN_" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000);

      const { data, error } = await insforge.functions.invoke('payu-payment', {
        body: {
          txnid: txnid,
          amount: plan.price.toString(),
          productinfo: `${plan.name} Plan`,
          firstname: user.name || user.full_name || 'Customer',
          email: user.email,
          udf1: shopId,
        }
      });

      if (error) throw new Error(`Function Error: ${error.message || JSON.stringify(error)}`);

      const hash = data?.hash;
      const key = data?.key;
      if (!hash || !key) throw new Error(`Hash generation failed. Response: ${JSON.stringify(data)}`);

      const form = document.createElement('form');
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
      appendInput('amount', plan.price.toString());
      appendInput('productinfo', `${plan.name} Plan`);
      appendInput('firstname', user.name || user.full_name || 'Customer');
      appendInput('email', user.email);
      appendInput('phone', user.phone || '9999999999');
      appendInput('udf1', shopId);
      appendInput('surl', CALLBACK_URL);
      appendInput('furl', CALLBACK_URL);
      appendInput('hash', hash);

      document.body.appendChild(form);
      form.submit();

    } catch (error) {
      console.error("Payment initiation failed", error);
      alert(`Payment Error: ${error.message}`);
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Choose Your Plan</h2>
          <p className="mt-3 text-lg text-gray-500">Start with ₹1 to test, upgrade anytime.</p>
        </div>

        {/* Current Subscription Banner */}
        {currentSubscription && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
              <span className="font-semibold text-green-800">Active Plan: {currentSubscription.plan}</span>
              <span className="ml-3 text-sm text-green-600">Expires: {new Date(currentSubscription.expires_at).toLocaleDateString()}</span>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all hover:shadow-xl hover:-translate-y-1 ${
                plan.id === 'growth' ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-indigo-300'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className={`${plan.badgeColor} text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider`}>
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-gray-900">₹{plan.price}</span>
                  <span className="text-gray-500 text-sm">/{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePayment(plan)}
                  disabled={loading !== null}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
                    plan.id === 'starter'
                      ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200'
                      : plan.id === 'growth'
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {loading === plan.id ? 'Processing...' : `Pay ₹${plan.price} Now`}
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Payments are securely processed via PayU. All plans activate instantly after successful payment.
        </p>
      </div>
    </div>
  );
}
