// ============ AUTH ============
export interface User {
  uid: string;
  email: string | null;
  displayName: string;
  avatar: string;
  level: number;
  xp: number;
  joinDate: string;
  country?: string;
}

// ============ GAMES ============
export type GameId = "wordless" | "songless" | "sayless" | "moreless" | "clueless" | "spellingbee" | "faceless";

export type GameResult = "win" | "loss" | "in-progress" | "not-started";

export interface GameState {
  gameId: GameId;
  date: string;
  result: GameResult;
  guesses: string[];
  startedAt: number;
  completedAt?: number;
  score?: number;
}

// ============ WORDLESS ============
export type TileState = "empty" | "tbd" | "correct" | "present" | "absent";

export interface WordlessTileData {
  letter: string;
  state: TileState;
}

// ============ SONGLESS ============
export interface Song {
  id: string;
  title: string;
  artist: string;
  snippetUrl: string;
  genre: string;
  year: number;
}

// ============ SAY LESS ============
export interface MovieQuote {
  id: string;
  movie: string;
  actor: string;
  quote: string;
  genre: string;
  year: number;
  clipUrl: string;
}

// ============ MORE/LESS ============
export interface MoreLessItem {
  name: string;
  value: number;
  category: string;
  unit: string;
  imageUrl?: string;
}

export interface MoreLessPair {
  itemA: MoreLessItem;
  itemB: MoreLessItem;
}

// ============ CLUELESS ============
export interface CluelessGuess {
  word: string;
  similarity: number;
  rank?: number;
}

// ============ SPELLING BEE ============
export interface SpellingBeeWord {
  word: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  audioUrl: string;
  definition?: string;
}

// ============ FACELESS ============
export interface FacelessCelebrity {
  name: string;
  category: "Actor" | "Musician" | "Athlete" | "TV Personality" | "Historical";
  wikiQuery: string;
}

// ============ STREAKS ============
export interface StreakData {
  current: number;
  longest: number;
  lastPlayedDate: string;
}

export interface UserStreaks {
  wordless: StreakData;
  songless: StreakData;
  sayless: StreakData;
  moreless: StreakData;
  clueless: StreakData;
  spellingbee: StreakData;
  faceless: StreakData;
  global: StreakData;
  gauntlet: StreakData;
  chain: StreakData;
}

// ============ PROFILE ============
export interface UserProfile {
  user: User;
  streaks: UserStreaks;
  unlocks: string[];
  totalGamesPlayed: number;
  totalWins: number;
  gauntletSurvivals: number;
}

// ============ HISTORY ============
export interface DailyHistory {
  date: string;
  games: Partial<Record<GameId, GameState>>;
  gauntlet?: {
    completed: boolean;
    survivedAll: boolean;
    gamesCompleted: GameId[];
  };
}

// ============ LEADERBOARD ============
export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  avatar: string;
  score: number;
  rank: number;
}

export type LeaderboardPeriod = "daily" | "weekly" | "alltime";

// ============ CHAIN ============
export type ChainGameId = Exclude<GameId, "wordless">;

export const CHAIN_GAMES: ChainGameId[] = [
  "songless", "sayless", "moreless", "clueless", "spellingbee", "faceless",
];

export interface Chain {
  id: string;
  date: string;
  status: "in_progress" | "completed" | "broken";
  currentLinkIndex: number;
  totalScore: number;
  links: ChainLink[];
  createdAt: string;
  completedAt?: string;
}

export interface ChainLink {
  id: number;
  chainId: string;
  linkIndex: number;
  uid: string;
  displayName?: string;
  avatar?: string;
  gameId: ChainGameId;
  result: "pending" | "playing" | "win" | "loss";
  score: number;
  startedAt?: string;
  completedAt?: string;
  nominatedNextUid?: string;
}

// ============ FRIENDS ============
export interface Friend {
  uid: string;
  displayName: string;
  avatar: string;
}

export interface FriendRequest {
  id: number;
  fromUid: string;
  fromDisplayName: string;
  fromAvatar: string;
  toUid: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

// ============ NOTIFICATIONS ============
export type NotificationType = "chain_invite" | "chain_turn" | "chain_result" | "friend_request";

export interface Notification {
  id: number;
  uid: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

// ============ ADS ============
export type AdPlacement = "home-banner" | "post-game-interstitial" | "gauntlet-interstitial" | "rewarded-video" | "leaderboard-rectangle";

// ============ XP ============
export const XP_REWARDS = {
  COMPLETE_DAILY: 50,
  WIN_DAILY: 100,
  COMPLETE_GAUNTLET: 300,
  SURVIVE_GAUNTLET: 500,
  COMPLETE_CHAIN: 300,
  SURVIVE_CHAIN: 500,
  STREAK_7: 200,
  STREAK_30: 1000,
  WATCH_AD: 25,
} as const;

export function xpForLevel(level: number): number {
  return level * 500;
}

export function levelFromXP(xp: number): number {
  return Math.floor(xp / 500) + 1;
}
