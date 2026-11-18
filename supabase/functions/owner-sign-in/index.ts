const siteOrigin = "https://discount-platform-suli.derin87-ali.workers.dev";
const url = Deno.env.get("SUPABASE_URL");
const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const headers = {
  "Access-Control-Allow-Origin": siteOrigin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-client-info",
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};
const failure = { error: "sign_in_failed" };

function reply(status: number, body: object) {
  return new Response(JSON.stringify(body), { status, headers });
}

Deno.serve(async (request: Request) => {
  if (request.headers.get("origin") !== siteOrigin) return reply(403, failure);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return reply(405, failure);
  if (!url || !publishableKey || !serviceKey) return reply(503, failure);

  try {
    const { phone, password } = await request.json();
    if (typeof phone !== "string" || !/^\+9647[0-9]{9}$/.test(phone) ||
        typeof password !== "string" || !password.length || password.length > 1024) {
      return reply(400, failure);
    }

    const lookup = await fetch(url + "/rest/v1/rpc/dashka_begin_owner_sign_in", {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: "Bearer " + serviceKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ login_phone: phone }),
    });
    if (!lookup.ok) return reply(503, failure);
    const email = await lookup.json();
    if (typeof email !== "string" || !email) return reply(401, failure);

    const auth = await fetch(url + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: { apikey: publishableKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!auth.ok) return reply(401, failure);

    const { access_token, refresh_token } = await auth.json();
    if (typeof access_token !== "string" || typeof refresh_token !== "string") {
      return reply(503, failure);
    }
    return reply(200, { access_token, refresh_token });
  } catch {
    return reply(400, failure);
  }
});
