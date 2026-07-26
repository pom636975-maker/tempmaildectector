import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Access environment variables for PayU credentials
const PAYU_MERCHANT_KEY = Deno.env.get("PAYU_MERCHANT_KEY")!;
const PAYU_MERCHANT_SALT = Deno.env.get("PAYU_MERCHANT_SALT")!;

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function generateHash(text: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-512", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    // ENDPOINT 1: Generate Hash
    if (url.pathname.endsWith("/generate-hash")) {
      const { txnid, amount, productinfo, firstname, email, udf1, udf2, udf3, udf4, udf5 } = await req.json();

      if (!txnid || !amount || !productinfo || !firstname || !email) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      // Format: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
      const hashString = `${PAYU_MERCHANT_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1 || ""}|${udf2 || ""}|${udf3 || ""}|${udf4 || ""}|${udf5 || ""}||||||${PAYU_MERCHANT_SALT}`;
      const hash = await generateHash(hashString);

      return new Response(JSON.stringify({ hash, key: PAYU_MERCHANT_KEY }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ENDPOINT 2: Payment Callback (Webhook/Redirect target)
    if (url.pathname.endsWith("/payment-callback")) {
      // PayU sends data as application/x-www-form-urlencoded on POST
      const formData = await req.formData();
      const status = formData.get("status") as string;
      const txnid = formData.get("txnid") as string;
      const amount = formData.get("amount") as string;
      const productinfo = formData.get("productinfo") as string;
      const firstname = formData.get("firstname") as string;
      const email = formData.get("email") as string;
      const mihpayid = formData.get("mihpayid") as string;
      const mode = formData.get("mode") as string;
      const hash = formData.get("hash") as string;
      const udf1 = formData.get("udf1") as string; // We can pass shop_id in udf1

      // Verify the reverse hash sent by PayU
      // Format: salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
      const reverseHashString = `${PAYU_MERCHANT_SALT}|${status}||||||||||${udf1 || ""}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${PAYU_MERCHANT_KEY}`;
      const expectedHash = await generateHash(reverseHashString);

      if (hash !== expectedHash) {
        return new Response("Invalid hash", { status: 400 });
      }

      // Hash is valid, update Supabase database
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const shopId = udf1;
      const isSuccess = status === "success";

      let expiresAt = null;
      if (isSuccess) {
        // Calculate expiry date: current date + 30 days
        const date = new Date();
        date.setDate(date.getDate() + 30);
        expiresAt = date.toISOString();
      }

      const { error } = await supabaseAdmin
        .from("subscriptions")
        .upsert({
          transaction_id: txnid,
          shop_id: shopId,
          plan: productinfo,
          amount: parseFloat(amount),
          status: isSuccess ? "active" : "failed",
          payu_transaction_id: mihpayid,
          payment_mode: mode,
          paid_at: isSuccess ? new Date().toISOString() : null,
          expires_at: expiresAt,
        }, { onConflict: 'transaction_id' });

      if (error) {
        console.error("Error updating subscription:", error);
      }

      // Redirect user to the frontend result page
      // Using an environment variable for the frontend URL
      const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:5173";
      const redirectUrl = `${frontendUrl}/subscription/result?status=${status}&txnid=${txnid}`;
      
      return Response.redirect(redirectUrl, 303);
    }

    return new Response("Not Found", { status: 404 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
