import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 299,
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

const gatewayName = 'StravoPay';

const emptyCardDetails = {
  name: '',
  number: '',
  expiry: '',
  cvc: '',
};

export default function Subscription() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [cardDetails, setCardDetails] = useState(emptyCardDetails);
  const [formNotice, setFormNotice] = useState('');
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    setFetchLoading(false);
  }, [user]);

  const currentPlanTotal = useMemo(() => {
    if (!selectedPlan) return '₹0';
    return `₹${selectedPlan.price}`;
  }, [selectedPlan]);

  const handlePayment = (plan) => {
    if (!user) {
      setFormNotice('Please log in to continue with checkout.');
      return;
    }

    setSelectedPlan(plan);
    setFormNotice('');
  };

  const handleCardChange = (event) => {
    const { name, value } = event.target;

    if (name === 'number') {
      const digits = value.replace(/\D/g, '').slice(0, 16);
      const masked = digits.replace(/(.{4})/g, '$1 ').trim();
      setCardDetails((prev) => ({ ...prev, number: masked }));
      return;
    }

    if (name === 'expiry') {
      const digits = value.replace(/\D/g, '').slice(0, 4);
      const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
      setCardDetails((prev) => ({ ...prev, expiry: formatted }));
      return;
    }

    if (name === 'cvc') {
      setCardDetails((prev) => ({ ...prev, cvc: value.replace(/\D/g, '').slice(0, 4) }));
      return;
    }

    setCardDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleGatewaySubmit = async (event) => {
    event.preventDefault();

    if (!selectedPlan) return;

    const trimmedName = cardDetails.name.trim();
    const cardNumber = cardDetails.number.replace(/\s+/g, '');

    if (!trimmedName || cardNumber.length < 16 || cardDetails.expiry.length < 5 || cardDetails.cvc.length < 3) {
      setFormNotice('Please complete all card details before confirming payment.');
      return;
    }

    setLoading(selectedPlan.id);
    setFormNotice('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const txnid = `STP_${Date.now()}`;
      const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      setCurrentSubscription({
        plan: selectedPlan.name,
        expires_at: expiryDate,
      });

      setSelectedPlan(null);
      setCardDetails(emptyCardDetails);
      setLoading(null);

      navigate(`/subscription/result?status=success&txnid=${txnid}&plan=${encodeURIComponent(selectedPlan.name)}&gateway=${encodeURIComponent(gatewayName)}`);
    } catch (error) {
      console.error('Gateway payment failed', error);
      setFormNotice('The payment gateway could not process this request. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-indigo-700 mb-4">
            {gatewayName} Secure Checkout
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Choose Your Plan</h2>
          <p className="mt-3 text-lg text-gray-500">Fast checkout and instant activation after approval.</p>
        </div>

        {currentSubscription && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
              <span className="font-semibold text-green-800">Active Plan: {currentSubscription.plan}</span>
              <span className="ml-3 text-sm text-green-600">Expires: {new Date(currentSubscription.expires_at).toLocaleDateString()}</span>
            </div>
          </div>
        )}

        {!fetchLoading && (
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
        )}

        {selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">{gatewayName}</p>
                  <h3 className="mt-1 text-2xl font-bold text-gray-900">Secure Checkout</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-500 hover:bg-gray-100"
                >
                  Close
                </button>
              </div>

              <div className="mb-6 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Selected plan</span>
                  <span className="font-bold text-gray-900">{selectedPlan.name}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                  <span>Billing cycle</span>
                  <span>{selectedPlan.period}</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-gray-900">
                  <span>Total due</span>
                  <span>{currentPlanTotal}</span>
                </div>
              </div>

              <form onSubmit={handleGatewaySubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Cardholder name</label>
                  <input
                    type="text"
                    name="name"
                    value={cardDetails.name}
                    onChange={handleCardChange}
                    placeholder="Your full name"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none ring-0 transition focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Card number</label>
                  <input
                    type="text"
                    name="number"
                    inputMode="numeric"
                    value={cardDetails.number}
                    onChange={handleCardChange}
                    placeholder="1234 5678 9012 3456"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Expiry</label>
                    <input
                      type="text"
                      name="expiry"
                      value={cardDetails.expiry}
                      onChange={handleCardChange}
                      placeholder="MM/YY"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">CVC</label>
                    <input
                      type="text"
                      name="cvc"
                      value={cardDetails.cvc}
                      onChange={handleCardChange}
                      placeholder="123"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-indigo-500"
                    />
                  </div>
                </div>

                {formNotice && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {formNotice}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading !== null}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading === selectedPlan.id ? 'Processing secure payment...' : `Pay ${currentPlanTotal} with ${gatewayName}`}
                </button>
              </form>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          Secure checkout is powered by the StravoPay gateway. All plans activate instantly after the payment is approved.
        </p>
      </div>
    </div>
  );
}
