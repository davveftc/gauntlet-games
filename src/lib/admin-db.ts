import { supabase } from "./supabase";

const todayStr = () => new Date().toISOString().split("T")[0];

export interface AdminStats {
  totalUsers: number;
  gamesToday: number;
  gamesAllTime: number;
  activeChains: number;
}

export interface AdminUser {
  uid: string;
  displayName: string;
  email: string | null;
  level: number;
  xp: number;
  totalGamesPlayed: number;
  totalWins: number;
  joinDate: string;
}

export interface GameAnalytics {
  gameId: string;
  plays: number;
  wins: number;
  losses: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const [usersRes, todayRes, allTimeRes, chainsRes] = await Promise.all([
    supabase.from("users").select("uid", { count: "exact", head: true }),
    supabase.from("game_history").select("id", { count: "exact", head: true }).eq("date", todayStr()),
    supabase.from("game_history").select("id", { count: "exact", head: true }),
    supabase.from("chains").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
  ]);

  return {
    totalUsers: usersRes.count ?? 0,
    gamesToday: todayRes.count ?? 0,
    gamesAllTime: allTimeRes.count ?? 0,
    activeChains: chainsRes.count ?? 0,
  };
}

export async function getAdminUsers(
  search?: string,
  limit = 50,
  offset = 0
): Promise<{ users: AdminUser[]; total: number }> {
  let query = supabase
    .from("users")
    .select("uid, display_name, email, level, xp, total_games_played, total_wins, join_date", { count: "exact" });

  if (search && search.trim()) {
    query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) return { users: [], total: 0 };

  return {
    users: data.map((row) => ({
      uid: row.uid,
      displayName: row.display_name,
      email: row.email,
      level: row.level,
      xp: row.xp,
      totalGamesPlayed: row.total_games_played,
      totalWins: row.total_wins,
      joinDate: row.join_date,
    })),
    total: count ?? 0,
  };
}

export async function getGameAnalytics(date?: string): Promise<GameAnalytics[]> {
  const d = date || todayStr();

  const { data, error } = await supabase
    .from("game_history")
    .select("game_id, result")
    .eq("date", d);

  if (error || !data) return [];

  const map = new Map<string, { plays: number; wins: number; losses: number }>();

  for (const row of data) {
    const entry = map.get(row.game_id) || { plays: 0, wins: 0, losses: 0 };
    entry.plays++;
    if (row.result === "win") entry.wins++;
    if (row.result === "loss") entry.losses++;
    map.set(row.game_id, entry);
  }

  return Array.from(map.entries()).map(([gameId, stats]) => ({
    gameId,
    ...stats,
  }));
}
