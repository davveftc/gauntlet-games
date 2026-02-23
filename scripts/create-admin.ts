/**
 * Creates an admin user in Supabase for the Gauntlet Games app.
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars,
 * or falls back to local defaults.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "demo-service-role-key";

const ADMIN_EMAIL = "admin@gauntlet.gg";
const ADMIN_PASSWORD = "GauntletAdmin2026!";
const ADMIN_DISPLAY_NAME = "Admin";

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Create the auth user via admin API
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: ADMIN_DISPLAY_NAME },
  });

  if (authError) {
    if (authError.message?.includes("already been registered")) {
      console.log(`User ${ADMIN_EMAIL} already exists — skipping auth creation.`);

      // Still ensure the profile row exists
      const { data: users } = await supabase.auth.admin.listUsers();
      const existing = users?.users?.find((u) => u.email === ADMIN_EMAIL);
      if (existing) {
        await ensureProfile(supabase, existing.id);
      }
    } else {
      console.error("Auth error:", authError.message);
      process.exit(1);
    }
  } else if (authData.user) {
    console.log(`Auth user created: ${authData.user.id}`);
    await ensureProfile(supabase, authData.user.id);
  }

  console.log("\n--- Admin Account ---");
  console.log(`Email:    ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
  console.log("---------------------\n");
}

async function ensureProfile(supabase: ReturnType<typeof createClient>, uid: string) {
  const today = new Date().toISOString().split("T")[0];

  const { data: existing } = await supabase
    .from("users")
    .select("uid")
    .eq("uid", uid)
    .single();

  if (existing) {
    console.log("Profile row already exists.");
    return;
  }

  const { error } = await supabase.from("users").insert({
    uid,
    display_name: ADMIN_DISPLAY_NAME,
    email: ADMIN_EMAIL,
    avatar: "default",
    level: 1,
    xp: 0,
    join_date: today,
    total_games_played: 0,
    total_wins: 0,
    gauntlet_survivals: 0,
    unlocks: [],
  });

  if (error) {
    console.error("Profile insert error:", error.message);
  } else {
    console.log("Profile row created.");
  }

  // Initialize streaks
  const gameIds = [
    "wordless", "songless", "sayless", "moreless", "clueless",
    "spellingbee", "faceless", "global", "gauntlet", "chain",
  ];
  const streakRows = gameIds.map((gameId) => ({
    uid,
    game_id: gameId,
    current: 0,
    longest: 0,
    last_played_date: null,
  }));
  await supabase.from("streaks").insert(streakRows);
  console.log("Streak rows created.");
}

main();
