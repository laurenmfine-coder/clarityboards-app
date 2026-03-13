/**
 * Clarityboards — Zapier Integration API
 * File: app/api/zapier/route.ts
 *
 * Handles all Zapier communication:
 *   GET  /api/zapier?action=me          → verify API key + return user info
 *   GET  /api/zapier?action=items       → polling trigger: new/updated items
 *   POST /api/zapier?action=create      → action: create item in a board
 *   POST /api/zapier?action=subscribe   → register a webhook URL
 *   DELETE /api/zapier?action=unsubscribe → remove a webhook URL
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "crypto";

// ─── Supabase service client (bypasses RLS for server-side ops) ───────────────

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getUserFromApiKey(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization") ?? "";
  const url = new URL(req.url);
  const apiKey = authHeader.replace("Bearer ", "").trim() || url.searchParams.get("api_key") || "";
  if (!apiKey) return null;

  const keyHash = createHash("sha256").update(apiKey).digest("hex");

  const { data } = await adminSupabase
    .from("zapier_api_keys")
    .select("user_id")
    .eq("key_hash", keyHash)
    .single();

  if (!data) return null;

  // Update last_used timestamp
  await adminSupabase
    .from("zapier_api_keys")
    .update({ last_used: new Date().toISOString() })
    .eq("key_hash", keyHash);

  return data.user_id;
}

function unauthorized() {
  return NextResponse.json(
    { error: "Invalid or missing API key. Generate one in Clarityboards → Settings → Zapier." },
    { status: 401 }
  );
}

// ─── GET handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const userId = await getUserFromApiKey(req);
  if (!userId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") ?? "items";

  // ── Verify auth (Zapier calls this to confirm the key works) ──
  if (action === "me") {
    const { data: user } = await adminSupabase.auth.admin.getUserById(userId);
    return NextResponse.json({
      id: userId,
      email: user?.user?.email ?? "",
      name: user?.user?.user_metadata?.full_name ?? "",
    });
  }

  // ── Polling trigger: return recent items ──
  if (action === "items") {
    const board = searchParams.get("board") ?? undefined;
    const since = searchParams.get("since"); // ISO timestamp for incremental polling
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 100);

    let query = adminSupabase
      .from("items")
      .select("id, board, title, date, notes, status, checklist, created_at")
      .eq("user_id", userId)
      .not("title", "like", "__boards__%")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (board) query = query.eq("board", board);
    if (since) query = query.gte("created_at", since);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Zapier expects an array; each item needs a unique string id
    const items = (data ?? []).map(item => ({
      id: item.id,
      board: item.board,
      title: item.title,
      date: item.date ?? "",
      notes: item.notes ?? "",
      status: item.status,
      checklist_count: Array.isArray(item.checklist) ? item.checklist.length : 0,
      checklist_done: Array.isArray(item.checklist)
        ? item.checklist.filter((c: any) => c.done).length
        : 0,
      created_at: item.created_at,
    }));

    return NextResponse.json(items);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const userId = await getUserFromApiKey(req);
  if (!userId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") ?? "create";

  // ── Action: create an item ──
  if (action === "create") {
    let body: any;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

    const { board, title, date, notes, status } = body;

    if (!board || !["event","study","activity","career","task"].includes(board)) {
      return NextResponse.json(
        { error: "board is required and must be one of: event, study, activity, career, task" },
        { status: 400 }
      );
    }
    if (!title?.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const { data, error } = await adminSupabase
      .from("items")
      .insert({
        user_id: userId,
        board,
        title: title.trim(),
        date: date || null,
        notes: notes || null,
        status: status || "todo",
        checklist: [],
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Fire any registered webhooks for this user + event type
    await fireWebhooks(userId, "item.created", data);

    return NextResponse.json({
      id: data.id,
      board: data.board,
      title: data.title,
      date: data.date ?? "",
      status: data.status,
      created_at: data.created_at,
    }, { status: 201 });
  }

  // ── Subscribe: Zapier registers a webhook URL ──
  if (action === "subscribe") {
    let body: any;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

    const { hook_url, board, event_type } = body;
    if (!hook_url) return NextResponse.json({ error: "hook_url is required" }, { status: 400 });

    const { data, error } = await adminSupabase
      .from("zapier_webhooks")
      .insert({
        user_id: userId,
        hook_url,
        board: board || null,
        event_type: event_type || "item.created",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: data.id }, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// ─── DELETE handler ───────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const userId = await getUserFromApiKey(req);
  if (!userId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") ?? "unsubscribe";

  if (action === "unsubscribe") {
    let body: any;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

    const { hook_url } = body;
    if (!hook_url) return NextResponse.json({ error: "hook_url is required" }, { status: 400 });

    await adminSupabase
      .from("zapier_webhooks")
      .delete()
      .eq("user_id", userId)
      .eq("hook_url", hook_url);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// ─── Webhook firing helper ────────────────────────────────────────────────────

async function fireWebhooks(userId: string, eventType: string, item: any) {
  const { data: hooks } = await adminSupabase
    .from("zapier_webhooks")
    .select("hook_url, board")
    .eq("user_id", userId)
    .eq("event_type", eventType);

  if (!hooks?.length) return;

  const payload = {
    event: eventType,
    item: {
      id: item.id,
      board: item.board,
      title: item.title,
      date: item.date ?? "",
      notes: item.notes ?? "",
      status: item.status,
      created_at: item.created_at,
    },
  };

  await Promise.allSettled(
    hooks
      .filter(h => !h.board || h.board === item.board) // board filter if set
      .map(h =>
        fetch(h.hook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch(() => {}) // don't throw if webhook is unreachable
      )
  );
}
