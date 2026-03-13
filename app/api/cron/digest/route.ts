/**
 * Clarityboards — Daily Digest
 * File: app/api/cron/digest/route.ts
 *
 * Runs daily at 7 AM via Vercel cron.
 * Sends each opted-in user a summary of items due today and tomorrow.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BOARD_LABELS: Record<string, string> = {
  event: "EventBoard",
  study: "StudyBoard",
  activity: "ActivityBoard",
  career: "CareerBoard",
  task: "TaskBoard",
};

const BOARD_COLORS: Record<string, string> = {
  event: "#1B4F8A",
  study: "#2E9E8F",
  activity: "#E67E22",
  career: "#8E44AD",
  task: "#27AE60",
};

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayStr = today.toISOString().split("T")[0];
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  // Get all users with digest enabled
  const { data: prefs } = await adminSupabase
    .from("notification_prefs")
    .select("user_id, digest_time")
    .eq("digest_enabled", true);

  if (!prefs?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;

  for (const pref of prefs) {
    try {
      // Get user email
      const { data: userData } = await adminSupabase.auth.admin.getUserById(pref.user_id);
      const email = userData?.user?.email;
      const name = userData?.user?.user_metadata?.full_name?.split(" ")[0] || "there";
      if (!email) continue;

      // Get items due today and tomorrow
      const { data: items } = await adminSupabase
        .from("items")
        .select("id, board, title, date, status")
        .eq("user_id", pref.user_id)
        .in("date", [todayStr, tomorrowStr])
        .not("status", "eq", "done")
        .not("title", "like", "__boards__%")
        .order("date", { ascending: true })
        .order("board", { ascending: true });

      if (!items?.length) continue;

      const todayItems = items.filter(i => i.date === todayStr);
      const tomorrowItems = items.filter(i => i.date === tomorrowStr);

      // Build email HTML
      const html = buildDigestEmail(name, todayItems, tomorrowItems, todayStr);

      // Send via Resend (or swap for any email provider)
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Clarityboards <digest@clarityboards.com>",
          to: email,
          subject: `Your day at a glance — ${formatDate(today)}`,
          html,
        }),
      });

      sent++;
    } catch (err) {
      console.error(`Digest failed for user ${pref.user_id}:`, err);
    }
  }

  return NextResponse.json({ sent, date: todayStr });
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function buildItemRows(items: any[]) {
  return items.map(item => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #F0F4F8;">
        <span style="display: inline-block; background: ${BOARD_COLORS[item.board]}15; color: ${BOARD_COLORS[item.board]}; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">${BOARD_LABELS[item.board]}</span>
        <div style="font-size: 14px; color: #1A2B3C; font-weight: 500;">${item.title}</div>
      </td>
    </tr>
  `).join("");
}

function buildDigestEmail(name: string, todayItems: any[], tomorrowItems: any[], todayStr: string) {
  const today = new Date(todayStr + "T12:00:00");
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin: 0; padding: 0; background: #F4F7FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 520px; margin: 0 auto; padding: 32px 16px;">

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 28px;">
      <div style="font-size: 22px; font-weight: 800; color: #1A2B3C; letter-spacing: -0.5px;">Clarityboards</div>
      <div style="font-size: 13px; color: #5A7A94; margin-top: 4px;">Good morning, ${name} — here's your day</div>
    </div>

    ${todayItems.length > 0 ? `
    <!-- Today -->
    <div style="background: white; border-radius: 14px; padding: 20px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
      <div style="font-size: 11px; font-weight: 700; color: #E67E22; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px;">📅 Today — ${formatDate(today)}</div>
      <table style="width: 100%; border-collapse: collapse;">
        ${buildItemRows(todayItems)}
      </table>
    </div>` : `
    <div style="background: white; border-radius: 14px; padding: 20px; margin-bottom: 16px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
      <div style="font-size: 28px; margin-bottom: 8px;">✨</div>
      <div style="font-size: 14px; color: #5A7A94;">Nothing due today — enjoy the breathing room!</div>
    </div>`}

    ${tomorrowItems.length > 0 ? `
    <!-- Tomorrow -->
    <div style="background: white; border-radius: 14px; padding: 20px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
      <div style="font-size: 11px; font-weight: 700; color: #2874A6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px;">🔜 Tomorrow</div>
      <table style="width: 100%; border-collapse: collapse;">
        ${buildItemRows(tomorrowItems)}
      </table>
    </div>` : ""}

    <!-- CTA -->
    <div style="text-align: center; margin-bottom: 28px;">
      <a href="https://clarityboards.com/dashboard" style="display: inline-block; background: #1A2B3C; color: white; text-decoration: none; padding: 13px 28px; border-radius: 10px; font-size: 14px; font-weight: 700;">Open Clarityboards →</a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; font-size: 11px; color: #9AABBD; line-height: 1.6;">
      You're receiving this because you enabled daily digest in Clarityboards.<br>
      <a href="https://clarityboards.com/settings/notifications" style="color: #9AABBD;">Manage notification settings</a>
    </div>
  </div>
</body>
</html>`;
}
