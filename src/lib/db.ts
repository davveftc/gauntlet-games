import { supabase } from "./supabase";
import type { User, GameState, GameId, DailyHistory, LeaderboardEntry } from "@/types";

const todayStr = () => new Date().toISOString().split("T")[0];

// ---- USER PROFILE ----
export async function getUserProfile(uid: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("uid", uid)
    .single();

  if (error || !data) return null;
  return {
    displayName: data.display_name,
    avatar: data.avatar,
    level: data.level,
    xp: data.xp,
    joinDate: data.join_date,
    totalGamesPlayed: data.total_games_played,
    totalWins: data.total_wins,
    gauntletSurvivals: data.gauntlet_survivals,
    unlocks: data.unlocks,
  };
}

export async function createUserProfile(uid: string, userData: Partial<User>) {
  const { data: existing } = await supabase
    .from("users")
    .select("uid")
    .eq("uid", uid)
    .single();

  if (existing) return;

  await supabase.from("users").insert({
    uid,
    display_name: userData.displayName || "Player",
    email: userData.email || null,
    avatar: "default",
    level: 1,
    xp: 0,
    join_date: todayStr(),
    total_games_played: 0,
    total_wins: 0,
    gauntlet_survivals: 0,
    unlocks: [],
  });

  // Initialize streaks for all game types
  const gameIds: (GameId | "global" | "gauntlet")[] = [
    "wordless", "songless", "moreless", "clueless", "spellingbee", "faceless", "global", "gauntlet",
  ];
  const streakRows = gameIds.map((gameId) => ({
    uid,
    game_id: gameId,
    current: 0,
    longest: 0,
    last_played_date: null,
  }));
  await supabase.from("streaks").insert(streakRows);
}

// ---- GAME HISTORY ----
export async function saveGameResult(uid: string, gameId: GameId, state: GameState) {
  const date = todayStr();

  const { data: existing } = await supabase
    .from("game_history")
    .select("id")
    .eq("uid", uid)
    .eq("game_id", gameId)
    .eq("date", date)
    .single();

  if (existing) {
    await supabase
      .from("game_history")
      .update({
        result: state.result,
        guesses: state.guesses,
        started_at: state.startedAt,
        completed_at: state.completedAt || null,
        score: state.score || null,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("game_history").insert({
      uid,
      game_id: gameId,
      date,
      result: state.result,
      guesses: state.guesses,
      started_at: state.startedAt,
      completed_at: state.completedAt || null,
      score: state.score || null,
    });
  }
}

export async function getDailyHistory(uid: string, date?: string): Promise<DailyHistory | null> {
  const d = date || todayStr();

  const { data, error } = await supabase
    .from("game_history")
    .select("*")
    .eq("uid", uid)
    .eq("date", d);

  if (error || !data || data.length === 0) return null;

  const games: Partial<Record<GameId, GameState>> = {};
  for (const row of data) {
    games[row.game_id as GameId] = {
      gameId: row.game_id,
      date: row.date,
      result: row.result,
      guesses: row.guesses || [],
      startedAt: row.started_at,
      completedAt: row.completed_at,
      score: row.score,
    };
  }

  return { date: d, games };
}

// ---- XP & STREAKS ----
export async function addXP(uid: string, amount: number) {
  const { data: user } = await supabase
    .from("users")
    .select("xp")
    .eq("uid", uid)
    .single();

  if (!user) return;

  await supabase
    .from("users")
    .update({ xp: user.xp + amount })
    .eq("uid", uid);
}

export async function updateStreak(uid: string, gameId: GameId | "global" | "gauntlet") {
  const today = todayStr();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const { data: streak } = await supabase
    .from("streaks")
    .select("*")
    .eq("uid", uid)
    .eq("game_id", gameId)
    .single();

  if (!streak) return;
  if (streak.last_played_date === today) return;

  const newCurrent = streak.last_played_date === yesterday ? streak.current + 1 : 1;
  const newLongest = Math.max(streak.longest, newCurrent);

  await supabase
    .from("streaks")
    .update({
      current: newCurrent,
      longest: newLongest,
      last_played_date: today,
    })
    .eq("uid", uid)
    .eq("game_id", gameId);
}

// ---- DAILY CONTENT ----
export async function getDailyContent(date?: string) {
  const d = date || todayStr();

  const { data, error } = await supabase
    .from("daily_content")
    .select("*")
    .eq("date", d)
    .single();

  if (error || !data) return null;
  return data;
}

// ---- LEADERBOARD ----
export async function getLeaderboard(period: string, date: string, max = 50): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from("leaderboard_entries")
    .select("*")
    .eq("period", period)
    .eq("date", date)
    .order("rank", { ascending: true })
    .limit(max);

  if (error || !data) return [];

  return data.map((row) => ({
    uid: row.uid,
    displayName: row.display_name,
    avatar: row.avatar,
    score: row.score,
    rank: row.rank,
  }));
}
