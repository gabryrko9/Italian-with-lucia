// Supabase Edge Function: create-checkout
// A signed-in student asks to buy a package. This function checks who they are,
// reads the price from the database (never from the browser) and opens a Stripe
// Checkout page. It returns the Stripe URL; the student is sent there to pay.
//
// Secrets (Supabase > Edge Functions > Secrets): STRIPE_SECRET_KEY
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
// Keep "Verify JWT" ON for this function.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const SITE = "https://italianwithlucia.com";
const CORS = {
  "Access-Control-Allow-Origin": SITE,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const auth = req.headers.get("Authorization") ?? "";
    const asUser = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await asUser.auth.getUser();
    const email = u?.user?.email?.toLowerCase();
    if (!email) return json({ error: "Please sign in again." }, 401);

    const { plan } = await req.json().catch(() => ({ plan: "" }));
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: student } = await admin.from("students").select("id, full_name, email").eq("email", email).maybeSingle();
    if (!student) return json({ error: "Lucia has no student account with this email yet." }, 403);

    const { data: p } = await admin.from("package_plans").select("*").eq("code", String(plan)).eq("active", true).maybeSingle();
    if (!p) return json({ error: "This package is not available." }, 400);

    const cents = Math.round(Number(p.price_eur) * 100);
    const form = new URLSearchParams({
      mode: "payment",
      customer_email: student.email,
      locale: "auto",
      success_url: `${SITE}/portal.html?paid=1`,
      cancel_url: `${SITE}/portal.html?paid=0`,
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "eur",
      "line_items[0][price_data][unit_amount]": String(cents),
      "line_items[0][price_data][product_data][name]": `Italian with Lucia: ${p.title}`,
      "line_items[0][price_data][product_data][description]": `${p.lessons} private Italian lessons of 60 minutes, online or in Prague.`,
      "metadata[student_id]": student.id,
      "metadata[plan_code]": p.code,
      "payment_intent_data[metadata][student_id]": student.id,
      "payment_intent_data[metadata][plan_code]": p.code,
      "payment_intent_data[receipt_email]": student.email,
    });

    const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("STRIPE_SECRET_KEY")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });
    const s = await r.json();
    if (!r.ok) {
      console.error("Stripe error", s);
      return json({ error: "The payment page could not be opened. Please try again or write to Lucia." }, 502);
    }
    return json({ url: s.url });
  } catch (e) {
    console.error(e);
    return json({ error: "Something went wrong. Please try again or write to Lucia." }, 500);
  }
});
