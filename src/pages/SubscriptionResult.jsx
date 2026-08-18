import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function SubscriptionResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get('status');
  const txnid = searchParams.get('txnid');
  const plan = searchParams.get('plan');
  const gateway = searchParams.get('gateway') || 'StravoPay';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          {status === 'success' ? (
            <div>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">✓</div>
              <h2 className="text-2xl font-bold text-green-600 mb-4">Payment Successful!</h2>
              <p className="text-gray-600 mb-1">Gateway: {gateway}</p>
              <p className="text-gray-600 mb-1">Plan: {plan || 'Selected plan'}</p>
              <p className="text-gray-600 mb-6">Transaction ID: {txnid}</p>
              <p className="text-gray-600 mb-6">Your subscription has been activated and is ready to use.</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <div>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">!</div>
              <h2 className="text-2xl font-bold text-red-600 mb-4">Payment Failed</h2>
              <p className="text-gray-600 mb-2">Transaction ID: {txnid}</p>
              <p className="text-gray-600 mb-6">Please try again or contact support.</p>
              <button
                onClick={() => navigate('/subscription')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
