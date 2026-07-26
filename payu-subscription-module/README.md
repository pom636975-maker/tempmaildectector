# PayU Subscription Module for Jewellery SaaS

This module contains the necessary files to integrate PayU Hosted Checkout into your existing React + Supabase Multi-tenant SaaS application.

## Prerequisites

1.  **PayU Merchant Account**: Ensure you have your `Merchant Key` and `Merchant Salt`.
2.  **Supabase Project**: You need to have the Supabase CLI installed if you intend to deploy the Edge Function.

## Setup Instructions

### 1. Database Configuration
Run the `create_subscriptions.sql` script in your Supabase SQL Editor to create the necessary table for storing subscription data and enabling RLS.

### 2. Backend (Supabase Edge Function)
1.  Initialize Supabase functions in your project if you haven't already: `supabase init`
2.  Create a new function: `supabase functions new payu-backend-function`
3.  Replace the contents of the newly created `index.ts` with the code in `payu-backend-function.ts`.
4.  Set the required environment variables in your Supabase project:
    *   `PAYU_MERCHANT_KEY`: Your PayU Merchant Key.
    *   `PAYU_MERCHANT_SALT`: Your PayU Merchant Salt.
    *   `FRONTEND_URL`: The URL of your React frontend (e.g., `http://localhost:5173` or your production URL).
5.  Deploy the function: `supabase functions deploy payu-backend-function --no-verify-jwt`
    *Note: We disable JWT verification for this function because the payment callback comes from PayU, not an authenticated user session.*

### 3. Frontend Integration (React)
1.  Copy `Subscription.jsx` and `SubscriptionGuard.jsx` into your React project (e.g., `src/pages/Subscription.jsx` and `src/components/SubscriptionGuard.jsx`).
2.  Update the import path for `supabaseClient` in both files to match your project's structure.
3.  In `Subscription.jsx`, replace `<PROJECT_REF>` in the fetch URL and callback URLs with your actual Supabase project reference ID.
4.  Update your application's routing (e.g., in `App.jsx` or `main.jsx`):
    *   Add a route for `/subscription` pointing to the `Subscription` component.
    *   Add a route for `/subscription/result` to handle the return redirect (you can point this back to the `Subscription` component or create a dedicated success/failure page).
5.  Wrap your protected dashboard routes with the `SubscriptionGuard`:

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SubscriptionGuard from './components/SubscriptionGuard';
import Dashboard from './pages/Dashboard';
import Subscription from './pages/Subscription';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/subscription" element={<Subscription />} />
        
        {/* Protected Routes */}
        <Route path="/*" element={
          <SubscriptionGuard>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              {/* ... other protected routes ... */}
            </Routes>
          </SubscriptionGuard>
        } />
      </Routes>
    </BrowserRouter>
  );
}
```

## Security Notes
*   The **PayU Salt** is strictly contained within the Supabase Edge Function environment variables. It is never sent to the frontend.
*   The hash is generated securely on the backend before redirecting to PayU.
*   The callback endpoint verifies the reverse hash sent by PayU before marking the subscription as active, preventing spoofing.
*   Row Level Security (RLS) is implemented on the `subscriptions` table.
