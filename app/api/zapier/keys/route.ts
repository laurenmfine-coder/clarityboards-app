/**
 * Clarityboards — API Key Management
 * File: app/api/zapier/keys/route.ts
 *
 * POST /api/zapier/keys  → generate a new API key for the logged-in user
 * DELETE /api/zapier/keys → revoke the current API key
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getSessionUser(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Generate a new random API key: cb_live_<32 random hex chars>
  const rawKey = `cb_live_${randomBytes(20).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.substring(0, 12); // "cb_live_xxxx" shown in UI

  // Delete any existing key for this user first
  await adminSupabase
    .from("zapier_api_keys")
    .delete()
    .eq("user_id", user.id);

  // Insert new key
  const { error } = await adminSupabase
    .from("zapier_api_keys")
    .insert({
      user_id: user.id,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      label: "Zapier",
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return the raw key ONCE — we never store it, only the hash
  return NextResponse.json({ api_key: rawKey, prefix: keyPrefix }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await adminSupabase
    .from("zapier_api_keys")
    .delete()
    .eq("user_id", user.id);

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data } = await adminSupabase
    .from("zapier_api_keys")
    .select("key_prefix, label, last_used, created_at")
    .eq("user_id", user.id)
    .single();

  if (!data) return NextResponse.json({ exists: false });
  return NextResponse.json({ exists: true, prefix: data.key_prefix, last_used: data.last_used, created_at: data.created_at });
}
