// Supabase Edge Function: stripe-webhook
// Stripe calls this address when a payment is completed. The function checks the
// Stripe signature (so nobody else can fake a payment) and then adds the package
// to the student's account. If Stripe sends the same event twice, the package is
// still created only once (see record_stripe_payment in 2-pacchetti-e-pagamenti.sql).
//
// Secrets (Supabase > Edge Functions > Secrets): STRIPE_WEBHOOK_SECRET
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
// Turn "Verify JWT" OFF for this function: Stripe cannot send a Supabase login.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const enc = new TextEncoder();

async function validSignature(payload: string, header: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]));
  const t = parts["t"];
  const sigs = header.split(",").filter((kv) => kv.startsWith("v1=")).map((kv) => kv.slice(3));
  if (!t || !sigs.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false; // older than 5 minutes
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${payload}`)));
  const hex = Array.from(mac, (b) => b.toString(16).padStart(2, "0")).join("");
  return sigs.some((s) => s.length === hex.length && [...s].every((c, i) => c === hex[i]));
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const payload = await req.text();
  const ok = await validSignature(payload, req.headers.get("Stripe-Signature") ?? "", Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "");
  if (!ok) return new Response("Bad signature", { status: 400 });

  const event = JSON.parse(payload);
  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
    return new Response("ignored", { status: 200 });
  }
  const s = event.data.object;
  if (s.payment_status !== "paid") return new Response("not paid yet", { status: 200 });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error } = await admin.rpc("record_stripe_payment", {
    p_session: s.id,
    p_student: s.metadata?.student_id,
    p_plan: s.metadata?.plan_code,
    p_amount: (s.amount_total ?? 0) / 100,
    p_email: s.customer_details?.email ?? s.customer_email ?? null,
  });
  if (error) {
    console.error("record_stripe_payment failed", error);
    return new Response("error", { status: 500 }); // Stripe retries automatically
  }
  return new Response("ok", { status: 200 });
});
