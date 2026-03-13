/**
 * Clarityboards — API Key Management
 * File: app/api/zapier/keys/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "crypto";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader.trim();
  
  if (!token) {
    console.log("[zapier/keys] No authorization header");
    return null;
  }

  console.log("[zapier/keys] Token prefix:", token.substring(0, 20));
  const { data: { user }, error } = await adminSupabase.auth.getUser(token);
  if (error) console.log("[zapier/keys] getUser error:", error.message);
  return user ?? null;
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const rawKey = `cb_live_${randomBytes(20).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.substring(0, 12);

  await adminSupabase.from("zapier_api_keys").delete().eq("user_id", user.id);

  const { error } = await adminSupabase.from("zapier_api_keys").insert({
    user_id: user.id,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    label: "Zapier",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ api_key: rawKey, prefix: keyPrefix }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await adminSupabase.from("zapier_api_keys").delete().eq("user_id", user.id);
  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data } = await adminSupabase
    .from("zapier_api_keys")
    .select("key_prefix, label, last_used, created_at")
    .eq("user_id", user.id)
    .single();

  if (!data) return NextResponse.json({ exists: false });
  return NextResponse.json({ exists: true, prefix: data.key_prefix, last_used: data.last_used, created_at: data.created_at });
}
