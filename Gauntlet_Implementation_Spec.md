# GAUNTLET — Implementation Specification for Claude Code

> **Purpose:** This document is a complete, executable specification. Claude Code should be able to read this document and build the entire application from scratch. Every file, component, route, schema, and style decision is defined here. No ambiguity — if something isn't specified, use your best judgment and note it.

---

## 0. PROJECT BOOTSTRAP

```bash
npx create-next-app@latest gauntlet --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd gauntlet
npm install firebase firebase-admin framer-motion howler zustand lucide-react clsx tailwind-merge
npm install -D @types/howler
```

### Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_ADSENSE_CLIENT_ID=
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_ADMIN_CLIENT_EMAIL=
```

---

## 1. FILE STRUCTURE

```
src/
├── app/
│   ├── layout.tsx              # Root layout: fonts, theme, providers, bottom nav
│   ├── page.tsx                # Home: game grid + gauntlet CTA
│   ├── login/
│   │   └── page.tsx            # Auth page (sign in / sign up)
│   ├── play/
│   │   ├── wordless/
│   │   │   └── page.tsx        # Wordless game page
│   │   ├── songless/
│   │   │   └── page.tsx        # Songless game page
│   │   ├── moreless/
│   │   │   └── page.tsx        # More/Less game page
│   │   ├── clueless/
│   │   │   └── page.tsx        # Clueless game page
│   │   └── spellingbee/
│   │       └── page.tsx        # Spelling Bee game page
│   ├── gauntlet/
│   │   └── page.tsx            # Gauntlet mode: sequential all-games run
│   ├── profile/
│   │   └── page.tsx            # User profile, stats, streaks, unlocks
│   ├── leaderboard/
│   │   └── page.tsx            # Leaderboards (daily, weekly, all-time)
│   ├── settings/
│   │   └── page.tsx            # User preferences, account management
│   └── admin/
│       └── page.tsx            # Owner admin dashboard
├── components/
│   ├── layout/
│   │   ├── BottomNav.tsx       # Bottom tab navigation bar
│   │   ├── TopBar.tsx          # Top bar with logo + XP indicator
│   │   └── AnimatedBackground.tsx  # Floating geometric shapes background
│   ├── auth/
│   │   ├── AuthForm.tsx        # Login/signup form with email + OAuth buttons
│   │   └── AuthGuard.tsx       # Wrapper that redirects unauthenticated users
│   ├── home/
│   │   ├── GameCard.tsx        # Individual game card on home grid
│   │   ├── GameGrid.tsx        # Grid layout of all game cards
│   │   ├── GauntletBanner.tsx  # Hero CTA banner for gauntlet mode
│   │   └── DailyStatus.tsx     # Shows ✅/🔥/⏳ per game
│   ├── games/
│   │   ├── wordless/
│   │   │   ├── WordlessBoard.tsx   # 6×5 grid of letter tiles
│   │   │   ├── Keyboard.tsx        # On-screen QWERTY keyboard
│   │   │   └── WordlessTile.tsx    # Individual letter tile with flip animation
│   │   ├── songless/
│   │   │   ├── SonglessPlayer.tsx  # Audio player with progressive reveal
│   │   │   ├── SongSearch.tsx      # Search input with autocomplete
│   │   │   └── SongGuessRow.tsx    # Individual guess display row
│   │   ├── moreless/
│   │   │   ├── MoreLessCard.tsx    # Comparison card (shows item + value reveal)
│   │   │   └── MoreLessGame.tsx    # Game logic: two cards, pick higher
│   │   ├── clueless/
│   │   │   ├── CluelessInput.tsx   # Word guess input
│   │   │   ├── SimilarityMeter.tsx # Hot/cold proximity bar
│   │   │   └── CluelessHistory.tsx # List of past guesses sorted by similarity
│   │   └── spellingbee/
│   │       ├── SpellingBeeAudio.tsx    # Audio playback of word pronunciation
│   │       ├── SpellingBeeInput.tsx    # Text input for spelling attempt
│   │       └── SpellingBeeProgress.tsx # Shows 1/5, 2/5, etc.
│   ├── gauntlet/
│   │   ├── GauntletRunner.tsx      # Orchestrates sequential game flow
│   │   ├── GauntletProgress.tsx    # Shows which games completed/remaining
│   │   └── GauntletResult.tsx      # Final result screen with share
│   ├── profile/
│   │   ├── StatsGrid.tsx       # Grid of stat cards (games played, win %, etc.)
│   │   ├── StreakDisplay.tsx   # Streak counters per game with fire animation
│   │   ├── XPBar.tsx           # XP progress bar with level indicator
│   │   └── UnlocksGrid.tsx     # Grid of earned cosmetics
│   ├── leaderboard/
│   │   ├── LeaderboardTable.tsx    # Ranked list with avatar, name, score
│   │   ├── LeaderboardTabs.tsx     # Tab switcher: daily/weekly/all-time
│   │   └── LeaderboardRow.tsx      # Single row with rank, user, score
│   ├── ads/
│   │   ├── BannerAd.tsx        # 320×50 sticky bottom banner
│   │   ├── InterstitialAd.tsx  # Full-screen interstitial overlay
│   │   ├── RewardedAdButton.tsx    # "Watch ad for XP" button
│   │   └── AdProvider.tsx      # Loads ad scripts, manages frequency caps
│   ├── shared/
│   │   ├── ShareCard.tsx       # Generates and displays share result
│   │   ├── ShareButton.tsx     # Copy/share to socials
│   │   ├── CountdownTimer.tsx  # Countdown to next daily reset
│   │   ├── ConfettiExplosion.tsx   # Confetti animation on wins
│   │   ├── Modal.tsx           # Reusable modal overlay
│   │   ├── Button.tsx          # Styled button with variants
│   │   ├── Card.tsx            # Styled card container
│   │   └── Toast.tsx           # Toast notification
│   └── ui/
│       ├── GlowText.tsx        # Text with neon glow effect
│       └── GradientBorder.tsx  # Animated gradient border wrapper
├── lib/
│   ├── firebase.ts             # Firebase app init + auth + firestore exports
│   ├── firebase-admin.ts       # Firebase admin SDK (server-side)
│   ├── auth.ts                 # Auth helper functions (signIn, signUp, signOut, onAuthChange)
│   ├── db.ts                   # Firestore read/write helpers
│   ├── ads.ts                  # Ad loading, frequency cap logic
│   └── utils.ts                # cn() helper, date formatting, share text generators
├── stores/
│   ├── authStore.ts            # Zustand: user auth state
│   ├── gameStore.ts            # Zustand: current game state (active game, guesses, result)
│   ├── profileStore.ts         # Zustand: user profile, XP, streaks, unlocks
│   └── adStore.ts              # Zustand: ad state, last interstitial timestamp
├── hooks/
│   ├── useAuth.ts              # Hook wrapping authStore with Firebase listener
│   ├── useGame.ts              # Hook for game state management
│   ├── useStreak.ts            # Hook for streak calculations
│   ├── useAds.ts               # Hook for ad display logic
│   └── useCountdown.ts         # Hook for next-reset countdown timer
├── data/
│   ├── wordless-words.json     # Array of 5-letter words for Wordless (2000+ words)
│   ├── songless-songs.json     # Array of { id, title, artist, snippetUrl, genre }
│   ├── moreless-pairs.json     # Array of { itemA, itemB, valueA, valueB, category, unit }
│   ├── clueless-words.json     # Array of target words with embedding vectors or similarity API
│   └── spellingbee-words.json  # Array of { word, difficulty: 1-5, audioUrl }
├── types/
│   └── index.ts                # All TypeScript interfaces and types
└── styles/
    └── globals.css             # Tailwind base + custom CSS variables + animations
```

---

## 2. DESIGN SYSTEM — EXACT IMPLEMENTATION

### 2.1 `globals.css`

```css
@import "tailwindcss";

:root {
  --bg-deep: #0D0221;
  --bg-surface: #1A1040;
  --bg-card: #241660;
  --primary: #6C2BD9;
  --primary-light: #8B5CF6;
  --secondary: #FF2D78;
  --accent: #FFC300;
  --success: #00E676;
  --error: #FF1744;
  --text-primary: #FFFFFF;
  --text-muted: #8B7FB8;
  --text-dim: #5A4F7A;
  --glow-purple: 0 0 20px rgba(108, 43, 217, 0.5), 0 0 40px rgba(108, 43, 217, 0.2);
  --glow-pink: 0 0 20px rgba(255, 45, 120, 0.5), 0 0 40px rgba(255, 45, 120, 0.2);
  --glow-gold: 0 0 20px rgba(255, 195, 0, 0.5), 0 0 40px rgba(255, 195, 0, 0.2);
}

body {
  background: var(--bg-deep);
  color: var(--text-primary);
  font-family: var(--font-body);
  overflow-x: hidden;
}

/* Animated background shapes */
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.15; }
  50% { transform: translateY(-30px) rotate(180deg); opacity: 0.25; }
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: var(--glow-purple); }
  50% { box-shadow: 0 0 30px rgba(108, 43, 217, 0.8), 0 0 60px rgba(108, 43, 217, 0.4); }
}

@keyframes tile-flip {
  0% { transform: rotateX(0deg); }
  50% { transform: rotateX(90deg); }
  100% { transform: rotateX(0deg); }
}

@keyframes slide-up {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

@keyframes fire-flicker {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.15); filter: brightness(1.3); }
}

.animate-float { animation: float 8s ease-in-out infinite; }
.animate-glow-pulse { animation: glow-pulse 2s ease-in-out infinite; }
.animate-tile-flip { animation: tile-flip 0.5s ease-in-out; }
.animate-slide-up { animation: slide-up 0.4s ease-out; }
.animate-shake { animation: shake 0.4s ease-in-out; }
.animate-fire { animation: fire-flicker 0.8s ease-in-out infinite; }

/* Glassmorphism card */
.glass-card {
  background: rgba(26, 16, 64, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(108, 43, 217, 0.3);
  border-radius: 16px;
}

/* Gradient border */
.gradient-border {
  position: relative;
  border-radius: 16px;
  padding: 2px;
  background: linear-gradient(135deg, var(--primary), var(--secondary), var(--accent));
}
.gradient-border > * {
  background: var(--bg-card);
  border-radius: 14px;
}

/* Neon glow text */
.neon-text {
  text-shadow: 0 0 10px rgba(108, 43, 217, 0.8), 0 0 20px rgba(108, 43, 217, 0.5), 0 0 40px rgba(108, 43, 217, 0.3);
}
.neon-text-pink {
  text-shadow: 0 0 10px rgba(255, 45, 120, 0.8), 0 0 20px rgba(255, 45, 120, 0.5), 0 0 40px rgba(255, 45, 120, 0.3);
}
.neon-text-gold {
  text-shadow: 0 0 10px rgba(255, 195, 0, 0.8), 0 0 20px rgba(255, 195, 0, 0.5), 0 0 40px rgba(255, 195, 0, 0.3);
}
```

### 2.2 Tailwind Config Extensions (`tailwind.config.ts`)

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        deep: "#0D0221",
        surface: "#1A1040",
        card: "#241660",
        primary: { DEFAULT: "#6C2BD9", light: "#8B5CF6" },
        secondary: "#FF2D78",
        accent: "#FFC300",
        success: "#00E676",
        error: "#FF1744",
        muted: "#8B7FB8",
        dim: "#5A4F7A",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      animation: {
        "float": "float 8s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "tile-flip": "tile-flip 0.5s ease-in-out",
        "slide-up": "slide-up 0.4s ease-out",
        "shake": "shake 0.4s ease-in-out",
        "fire": "fire-flicker 0.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
```

### 2.3 Fonts — `app/layout.tsx`

Use Google Fonts: **Space Grotesk** for display and **DM Sans** for body. Import via `next/font/google`.

```typescript
import { Space_Grotesk, DM_Sans } from "next/font/google";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "700"],
});
```

> **Note:** If you want a more unique display font, replace Space_Grotesk with Clash Display (loaded via @font-face from a CDN like `https://api.fontshare.com`). But Space Grotesk ships fast via next/font.

---

## 3. TYPESCRIPT TYPES — `types/index.ts`

```typescript
// ============ AUTH ============
export interface User {
  uid: string;
  email: string | null;
  displayName: string;
  avatar: string; // avatar ID key, e.g. "default", "neon_01"
  level: number;
  xp: number;
  joinDate: string; // ISO date
  country?: string;
}

// ============ GAMES ============
export type GameId = "wordless" | "songless" | "moreless" | "clueless" | "spellingbee";

export type GameResult = "win" | "loss" | "in-progress" | "not-started";

export interface GameState {
  gameId: GameId;
  date: string; // YYYY-MM-DD
  result: GameResult;
  guesses: string[];
  startedAt: number; // timestamp
  completedAt?: number;
  score?: number; // game-specific score
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
  snippetUrl: string; // URL to audio file
  genre: string;
  year: number;
}

// ============ MORE/LESS ============
export interface MoreLessItem {
  name: string;
  value: number;
  category: string; // e.g. "Google searches per month"
  unit: string; // e.g. "searches/month"
  imageUrl?: string;
}

export interface MoreLessPair {
  itemA: MoreLessItem;
  itemB: MoreLessItem;
}

// ============ CLUELESS ============
export interface CluelessGuess {
  word: string;
  similarity: number; // 0-100
  rank?: number;
}

// ============ SPELLING BEE ============
export interface SpellingBeeWord {
  word: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  audioUrl: string;
  definition?: string;
}

// ============ STREAKS ============
export interface StreakData {
  current: number;
  longest: number;
  lastPlayedDate: string; // YYYY-MM-DD
}

export interface UserStreaks {
  wordless: StreakData;
  songless: StreakData;
  moreless: StreakData;
  clueless: StreakData;
  spellingbee: StreakData;
  global: StreakData; // played any game
  gauntlet: StreakData; // completed full gauntlet
}

// ============ PROFILE ============
export interface UserProfile {
  user: User;
  streaks: UserStreaks;
  unlocks: string[]; // IDs of unlocked cosmetics
  totalGamesPlayed: number;
  totalWins: number;
  gauntletSurvivals: number;
}

// ============ HISTORY ============
export interface DailyHistory {
  date: string; // YYYY-MM-DD
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

// ============ ADS ============
export type AdPlacement = "home-banner" | "post-game-interstitial" | "gauntlet-interstitial" | "rewarded-video" | "leaderboard-rectangle";

// ============ XP ============
export const XP_REWARDS = {
  COMPLETE_DAILY: 50,
  WIN_DAILY: 100,
  COMPLETE_GAUNTLET: 300,
  SURVIVE_GAUNTLET: 500,
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
```

---

## 4. FIREBASE CONFIG — `lib/firebase.ts`

```typescript
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as fbSignOut, onAuthStateChanged, type User as FBUser } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, fbSignOut as signOut, onAuthStateChanged };
export type { FBUser };
```

---

## 5. FIRESTORE DATA MODEL — `lib/db.ts`

### Collections & Documents

```
users/{uid}
  ├── profile: { displayName, avatar, level, xp, joinDate, country }
  ├── streaks: { wordless: { current, longest, lastPlayedDate }, ... }
  └── unlocks: ["avatar_neon", "frame_fire", ...]

users/{uid}/history/{YYYY-MM-DD}
  ├── wordless: { result, guesses, startedAt, completedAt, score }
  ├── songless: { result, guesses, startedAt, completedAt, score }
  ├── moreless: { result, guesses, startedAt, completedAt, score }
  ├── clueless: { result, guesses, startedAt, completedAt, score }
  ├── spellingbee: { result, guesses, startedAt, completedAt, score }
  └── gauntlet: { completed, survivedAll, gamesCompleted }

leaderboards/{period}_{date}
  └── entries: [ { uid, displayName, avatar, score, rank } ]

dailyContent/{YYYY-MM-DD}
  ├── wordless: { word: "CRANE" }
  ├── songless: { songId: "abc123" }
  ├── moreless: { pairs: [ { itemA, itemB, valueA, valueB } ] }  // 10 pairs
  ├── clueless: { targetWord: "OCEAN" }
  └── spellingbee: { words: ["rhythm", "necessary", "bureaucracy", "onomatopoeia", "antidisestablishmentarianism"] }
```

### Implementation (`lib/db.ts`)

```typescript
import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, collection, query, orderBy, limit, getDocs, increment, serverTimestamp } from "firebase/firestore";
import type { User, UserStreaks, GameState, GameId, DailyHistory, LeaderboardEntry } from "@/types";

const todayStr = () => new Date().toISOString().split("T")[0];

// ---- USER PROFILE ----
export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export async function createUserProfile(uid: string, data: Partial<User>) {
  await setDoc(doc(db, "users", uid), {
    displayName: data.displayName || "Player",
    avatar: "default",
    level: 1,
    xp: 0,
    joinDate: todayStr(),
    streaks: {
      wordless: { current: 0, longest: 0, lastPlayedDate: "" },
      songless: { current: 0, longest: 0, lastPlayedDate: "" },
      moreless: { current: 0, longest: 0, lastPlayedDate: "" },
      clueless: { current: 0, longest: 0, lastPlayedDate: "" },
      spellingbee: { current: 0, longest: 0, lastPlayedDate: "" },
      global: { current: 0, longest: 0, lastPlayedDate: "" },
      gauntlet: { current: 0, longest: 0, lastPlayedDate: "" },
    },
    unlocks: [],
    totalGamesPlayed: 0,
    totalWins: 0,
    gauntletSurvivals: 0,
  });
}

// ---- GAME HISTORY ----
export async function saveGameResult(uid: string, gameId: GameId, state: GameState) {
  const date = todayStr();
  const ref = doc(db, "users", uid, "history", date);
  await setDoc(ref, { [gameId]: state }, { merge: true });
}

export async function getDailyHistory(uid: string, date?: string): Promise<DailyHistory | null> {
  const d = date || todayStr();
  const snap = await getDoc(doc(db, "users", uid, "history", d));
  return snap.exists() ? { date: d, games: snap.data() } as DailyHistory : null;
}

// ---- XP & STREAKS ----
export async function addXP(uid: string, amount: number) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { xp: increment(amount) });
}

export async function updateStreak(uid: string, gameId: GameId | "global" | "gauntlet") {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const streaks = data.streaks || {};
  const streak = streaks[gameId] || { current: 0, longest: 0, lastPlayedDate: "" };
  const today = todayStr();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (streak.lastPlayedDate === today) return; // already played today

  const newCurrent = streak.lastPlayedDate === yesterday ? streak.current + 1 : 1;
  const newLongest = Math.max(streak.longest, newCurrent);

  await updateDoc(userRef, {
    [`streaks.${gameId}.current`]: newCurrent,
    [`streaks.${gameId}.longest`]: newLongest,
    [`streaks.${gameId}.lastPlayedDate`]: today,
  });
}

// ---- DAILY CONTENT ----
export async function getDailyContent(date?: string) {
  const d = date || todayStr();
  const snap = await getDoc(doc(db, "dailyContent", d));
  return snap.exists() ? snap.data() : null;
}

// ---- LEADERBOARD ----
export async function getLeaderboard(period: string, date: string, max = 50): Promise<LeaderboardEntry[]> {
  const ref = doc(db, "leaderboards", `${period}_${date}`);
  const snap = await getDoc(ref);
  if (!snap.exists()) return [];
  const entries = snap.data().entries || [];
  return entries.slice(0, max);
}
```

---

## 6. ZUSTAND STORES

### `stores/authStore.ts`

```typescript
import { create } from "zustand";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
}));
```

### `stores/gameStore.ts`

```typescript
import { create } from "zustand";
import type { GameId, GameResult } from "@/types";

interface GameStoreState {
  activeGame: GameId | null;
  guesses: string[];
  result: GameResult;
  startedAt: number | null;
  completedAt: number | null;

  startGame: (gameId: GameId) => void;
  addGuess: (guess: string) => void;
  setResult: (result: GameResult) => void;
  reset: () => void;
}

export const useGameStore = create<GameStoreState>((set) => ({
  activeGame: null,
  guesses: [],
  result: "not-started",
  startedAt: null,
  completedAt: null,

  startGame: (gameId) => set({
    activeGame: gameId,
    guesses: [],
    result: "in-progress",
    startedAt: Date.now(),
    completedAt: null,
  }),
  addGuess: (guess) => set((state) => ({ guesses: [...state.guesses, guess] })),
  setResult: (result) => set({ result, completedAt: Date.now() }),
  reset: () => set({
    activeGame: null,
    guesses: [],
    result: "not-started",
    startedAt: null,
    completedAt: null,
  }),
}));
```

### `stores/adStore.ts`

```typescript
import { create } from "zustand";

interface AdState {
  lastInterstitialTime: number;
  rewardedAdsWatchedToday: number;
  canShowInterstitial: () => boolean;
  recordInterstitial: () => void;
  recordRewardedAd: () => void;
}

export const useAdStore = create<AdState>((set, get) => ({
  lastInterstitialTime: 0,
  rewardedAdsWatchedToday: 0,
  canShowInterstitial: () => Date.now() - get().lastInterstitialTime > 60000,
  recordInterstitial: () => set({ lastInterstitialTime: Date.now() }),
  recordRewardedAd: () => set((s) => ({ rewardedAdsWatchedToday: s.rewardedAdsWatchedToday + 1 })),
}));
```

---

## 7. GAME LOGIC — DETAILED RULES

### 7.1 Wordless

**Mechanics (identical to Wordle):**
1. A random 5-letter word is selected for each day (seeded by date).
2. Player has 6 guesses. Each guess must be a valid 5-letter English word.
3. After each guess, each letter is colored: `correct` (green — right letter, right position), `present` (yellow — right letter, wrong position), `absent` (gray — letter not in word).
4. On-screen keyboard reflects letter states across all guesses.
5. Win = guessed the word within 6 tries. Loss = used all 6 without guessing.

**Daily word selection logic:**
```typescript
function getDailyWord(words: string[], date: string): string {
  // Deterministic: hash date string to get index
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = ((hash << 5) - hash) + date.charCodeAt(i);
    hash |= 0;
  }
  return words[Math.abs(hash) % words.length];
}
```

**Tile states for a guess:**
```typescript
function evaluateGuess(guess: string, target: string): TileState[] {
  const result: TileState[] = Array(5).fill("absent");
  const targetChars = target.split("");
  const guessChars = guess.split("");

  // First pass: correct positions
  for (let i = 0; i < 5; i++) {
    if (guessChars[i] === targetChars[i]) {
      result[i] = "correct";
      targetChars[i] = "#"; // mark as used
      guessChars[i] = "*";
    }
  }
  // Second pass: present (wrong position)
  for (let i = 0; i < 5; i++) {
    if (guessChars[i] === "*") continue;
    const idx = targetChars.indexOf(guessChars[i]);
    if (idx !== -1) {
      result[i] = "present";
      targetChars[idx] = "#";
    }
  }
  return result;
}
```

### 7.2 Songless

**Mechanics:**
1. A song is selected for the day.
2. Player hears a 0.1-second snippet.
3. On wrong guess (or skip), snippet extends: 0.1s → 0.3s → 0.5s → 1s → 2s → 5s.
4. Player searches for a song (autocomplete from catalog). 6 total guesses.
5. Win = correctly identify song title + artist.

**Audio implementation:**
- Use Howler.js to load and play audio with precise `sprite` definitions:
```typescript
const sound = new Howl({
  src: [snippetUrl],
  sprite: {
    s1: [0, 100],    // 0.1s
    s2: [0, 300],    // 0.3s
    s3: [0, 500],    // 0.5s
    s4: [0, 1000],   // 1s
    s5: [0, 2000],   // 2s
    s6: [0, 5000],   // 5s
  },
});
// Play current level: sound.play(`s${guessNumber + 1}`);
```

### 7.3 More/Less

**Mechanics:**
1. Two items are shown side by side with a category (e.g., "Google searches per month").
2. Item A shows its value. Item B's value is hidden.
3. Player chooses: is Item B HIGHER or LOWER than Item A?
4. If correct, Item B becomes the new Item A. A new Item B is shown.
5. Game is a streak: how many in a row can you get right? One wrong = game over.
6. Daily mode: 10 fixed pairs. Score = how many correct.

### 7.4 Clueless

**Mechanics (similar to Semantle):**
1. A secret word is chosen for the day.
2. Player types any word. The game returns a similarity score (0–100) based on semantic similarity.
3. Guesses are displayed in a list sorted by similarity (hottest at top).
4. Visual proximity meter shows how close the latest guess is (cold=blue, warm=orange, hot=red).
5. Win = guess the exact word. No guess limit, but score is based on number of guesses taken.
6. Similarity is computed server-side using word embeddings (or a precomputed lookup table for the daily word).

**Implementation note:** For MVP, precompute the top 1000 closest words + similarity scores for each daily target word and store them in `dailyContent`. Client sends guess → looks up in precomputed map → returns score. If not in map, return a base low score (0-20 range, random but deterministic).

### 7.5 Spelling Bee

**Mechanics:**
1. 5 words are presented in sequence, increasing in difficulty (1-star to 5-star).
2. For each word: an audio pronunciation plays. Player types their spelling.
3. One attempt per word. Correct = move to next. Wrong = eliminated (in Gauntlet mode) or shown answer (in solo mode).
4. Score = how many of 5 spelled correctly.

---

## 8. KEY COMPONENT IMPLEMENTATIONS

### 8.1 `components/layout/AnimatedBackground.tsx`

```tsx
"use client";
import { motion } from "framer-motion";

const shapes = [
  { type: "circle", size: 60, x: "10%", y: "20%", delay: 0, duration: 10 },
  { type: "triangle", size: 40, x: "80%", y: "15%", delay: 2, duration: 12 },
  { type: "hexagon", size: 50, x: "60%", y: "70%", delay: 4, duration: 8 },
  { type: "circle", size: 30, x: "25%", y: "80%", delay: 1, duration: 14 },
  { type: "triangle", size: 70, x: "90%", y: "50%", delay: 3, duration: 11 },
  { type: "circle", size: 45, x: "50%", y: "30%", delay: 5, duration: 9 },
  { type: "hexagon", size: 35, x: "15%", y: "55%", delay: 2.5, duration: 13 },
];

function Shape({ type, size }: { type: string; size: number }) {
  if (type === "circle") {
    return (
      <div
        className="rounded-full border-2 border-primary/30"
        style={{ width: size, height: size }}
      />
    );
  }
  if (type === "triangle") {
    return (
      <div
        style={{
          width: 0, height: 0,
          borderLeft: `${size / 2}px solid transparent`,
          borderRight: `${size / 2}px solid transparent`,
          borderBottom: `${size}px solid rgba(108, 43, 217, 0.2)`,
        }}
      />
    );
  }
  // hexagon via CSS clip-path
  return (
    <div
      className="bg-primary/15"
      style={{
        width: size, height: size,
        clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
      }}
    />
  );
}

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {shapes.map((s, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: s.x, top: s.y }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 180, 360],
            opacity: [0.1, 0.25, 0.1],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Shape type={s.type} size={s.size} />
        </motion.div>
      ))}
    </div>
  );
}
```

### 8.2 `components/layout/BottomNav.tsx`

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Swords, Trophy, User } from "lucide-react";
import { clsx } from "clsx";

const tabs = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/gauntlet", icon: Swords, label: "Gauntlet" },
  { href: "/leaderboard", icon: Trophy, label: "Ranks" },
  { href: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-t border-primary/20">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
                active ? "text-accent" : "text-muted hover:text-white"
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
              {active && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-accent" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

### 8.3 `components/home/GameCard.tsx`

```tsx
"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import type { GameId, GameResult } from "@/types";

interface GameCardProps {
  gameId: GameId;
  title: string;
  description: string;
  emoji: string;
  status: GameResult;
  streak: number;
}

const statusBadge: Record<GameResult, { text: string; color: string }> = {
  "win": { text: "✅ Done", color: "text-success" },
  "loss": { text: "❌ Done", color: "text-error" },
  "in-progress": { text: "⏳ In Progress", color: "text-accent" },
  "not-started": { text: "Play Now", color: "text-primary-light" },
};

export default function GameCard({ gameId, title, description, emoji, status, streak }: GameCardProps) {
  const badge = statusBadge[status];

  return (
    <Link href={`/play/${gameId}`}>
      <motion.div
        className="glass-card p-5 cursor-pointer group relative overflow-hidden"
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Gradient glow on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">{emoji}</span>
            {streak > 0 && (
              <span className="flex items-center gap-1 text-accent text-sm font-bold animate-fire">
                🔥 {streak}
              </span>
            )}
          </div>
          <h3 className="font-display text-lg font-bold mb-1">{title}</h3>
          <p className="text-muted text-sm mb-3">{description}</p>
          <span className={`text-sm font-medium ${badge.color}`}>{badge.text}</span>
        </div>
      </motion.div>
    </Link>
  );
}
```

### 8.4 `components/shared/Button.tsx`

```tsx
"use client";
import { motion } from "framer-motion";
import { clsx } from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "accent";
  size?: "sm" | "md" | "lg";
  glow?: boolean;
}

export default function Button({
  children, variant = "primary", size = "md", glow = false, className, ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={clsx(
        "font-display font-bold rounded-2xl transition-all",
        {
          "bg-primary hover:bg-primary-light text-white": variant === "primary",
          "bg-secondary hover:brightness-110 text-white": variant === "secondary",
          "bg-accent hover:brightness-110 text-deep": variant === "accent",
          "bg-transparent border border-primary/40 hover:bg-primary/10 text-white": variant === "ghost",
        },
        {
          "px-4 py-2 text-sm": size === "sm",
          "px-6 py-3 text-base": size === "md",
          "px-8 py-4 text-lg": size === "lg",
        },
        glow && "animate-glow-pulse",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
```

---

## 9. ADS IMPLEMENTATION

### 9.1 `components/ads/AdProvider.tsx`

```tsx
"use client";
import Script from "next/script";

export default function AdProvider() {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  if (!clientId) return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
```

### 9.2 `components/ads/BannerAd.tsx`

```tsx
"use client";
import { useEffect, useRef } from "react";

export default function BannerAd({ slot }: { slot: string }) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      // @ts-expect-error adsbygoogle
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, []);

  return (
    <div ref={adRef} className="w-full flex justify-center py-2 bg-surface/50">
      <ins
        className="adsbygoogle"
        style={{ display: "inline-block", width: 320, height: 50 }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
      />
    </div>
  );
}
```

### 9.3 `components/ads/InterstitialAd.tsx`

```tsx
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAdStore } from "@/stores/adStore";

interface InterstitialAdProps {
  show: boolean;
  onClose: () => void;
  slot: string;
}

export default function InterstitialAd({ show, onClose, slot }: InterstitialAdProps) {
  const [canClose, setCanClose] = useState(false);
  const { recordInterstitial } = useAdStore();

  useEffect(() => {
    if (show) {
      recordInterstitial();
      const timer = setTimeout(() => setCanClose(true), 5000); // 5s minimum
      return () => clearTimeout(timer);
    }
    setCanClose(false);
  }, [show, recordInterstitial]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-deep/95 flex items-center justify-center"
        >
          {canClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted hover:text-white p-2"
            >
              <X size={28} />
            </button>
          )}
          <div className="w-full max-w-sm mx-auto">
            <ins
              className="adsbygoogle"
              style={{ display: "block", width: "100%", height: 300 }}
              data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
              data-ad-slot={slot}
              data-ad-format="auto"
            />
            {!canClose && (
              <p className="text-muted text-sm text-center mt-4">
                Ad closes in 5 seconds...
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### 9.4 `components/ads/RewardedAdButton.tsx`

```tsx
"use client";
import Button from "@/components/shared/Button";
import { useAdStore } from "@/stores/adStore";
import { useAuthStore } from "@/stores/authStore";
import { addXP } from "@/lib/db";
import { XP_REWARDS } from "@/types";

interface RewardedAdButtonProps {
  label?: string;
  onReward?: () => void;
}

export default function RewardedAdButton({ label = "Watch Ad for +25 XP", onReward }: RewardedAdButtonProps) {
  const { rewardedAdsWatchedToday, recordRewardedAd } = useAdStore();
  const { user } = useAuthStore();

  if (rewardedAdsWatchedToday >= 5) return null; // max 5/day

  const handleClick = async () => {
    // In production, integrate a real rewarded ad SDK.
    // For MVP, simulate with a timeout.
    recordRewardedAd();
    if (user) {
      await addXP(user.uid, XP_REWARDS.WATCH_AD);
    }
    onReward?.();
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleClick}>
      🎬 {label}
    </Button>
  );
}
```

---

## 10. PAGE IMPLEMENTATIONS

### 10.1 `app/layout.tsx`

```tsx
import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import AnimatedBackground from "@/components/layout/AnimatedBackground";
import BottomNav from "@/components/layout/BottomNav";
import AdProvider from "@/components/ads/AdProvider";
import "@/styles/globals.css";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Gauntlet — Daily Games",
  description: "Play Wordless, Songless, More/Less, Clueless, and Spelling Bee. Survive the Gauntlet.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="font-body min-h-screen bg-deep text-white">
        <AdProvider />
        <AnimatedBackground />
        <main className="relative z-10 pb-20 max-w-lg mx-auto px-4">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
```

### 10.2 `app/page.tsx` — Home

```tsx
"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { getDailyHistory } from "@/lib/db";
import GameGrid from "@/components/home/GameGrid";
import GauntletBanner from "@/components/home/GauntletBanner";
import TopBar from "@/components/layout/TopBar";
import BannerAd from "@/components/ads/BannerAd";
import type { DailyHistory, GameId } from "@/types";

const GAMES: { gameId: GameId; title: string; description: string; emoji: string }[] = [
  { gameId: "wordless", title: "Wordless", description: "Guess the 5-letter word in 6 tries", emoji: "🔤" },
  { gameId: "songless", title: "Songless", description: "Name the song from a 0.1s clip", emoji: "🎵" },
  { gameId: "moreless", title: "More/Less", description: "Which is higher? Don't overthink it", emoji: "📊" },
  { gameId: "clueless", title: "Clueless", description: "Find the secret word by similarity", emoji: "🔍" },
  { gameId: "spellingbee", title: "Spelling Bee", description: "Spell 5 words, each harder than the last", emoji: "🐝" },
];

export default function HomePage() {
  const { user } = useAuthStore();
  const [history, setHistory] = useState<DailyHistory | null>(null);

  useEffect(() => {
    if (user) {
      getDailyHistory(user.uid).then(setHistory);
    }
  }, [user]);

  return (
    <div className="pt-6">
      <TopBar />
      <GauntletBanner />
      <GameGrid games={GAMES} history={history} />
      <div className="fixed bottom-16 left-0 right-0 z-40">
        <BannerAd slot="HOME_BANNER_SLOT_ID" />
      </div>
    </div>
  );
}
```

### 10.3 `app/login/page.tsx` — Auth

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "@/lib/firebase";
import { createUserProfile } from "@/lib/db";
import Button from "@/components/shared/Button";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await createUserProfile(cred.user.uid, { displayName: displayName || "Player", email });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      // Create profile if new user
      await createUserProfile(cred.user.uid, {
        displayName: cred.user.displayName || "Player",
        email: cred.user.email,
      });
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card p-8 w-full max-w-sm">
        <h1 className="font-display text-3xl font-bold text-center mb-2 neon-text">
          GAUNTLET
        </h1>
        <p className="text-muted text-center text-sm mb-8">
          {isSignUp ? "Create your account" : "Welcome back"}
        </p>

        {error && (
          <p className="text-error text-sm text-center mb-4 bg-error/10 rounded-lg p-2">{error}</p>
        )}

        <form onSubmit={handleEmail} className="space-y-4">
          {isSignUp && (
            <input
              type="text"
              placeholder="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-deep/50 border border-primary/30 rounded-xl px-4 py-3 text-white placeholder:text-dim focus:outline-none focus:border-primary"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-deep/50 border border-primary/30 rounded-xl px-4 py-3 text-white placeholder:text-dim focus:outline-none focus:border-primary"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-deep/50 border border-primary/30 rounded-xl px-4 py-3 text-white placeholder:text-dim focus:outline-none focus:border-primary"
          />
          <Button type="submit" variant="primary" size="lg" className="w-full">
            {isSignUp ? "Sign Up" : "Sign In"}
          </Button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-primary/20" />
          <span className="px-4 text-dim text-sm">or</span>
          <div className="flex-1 h-px bg-primary/20" />
        </div>

        <Button variant="ghost" size="lg" className="w-full" onClick={handleGoogle}>
          Continue with Google
        </Button>

        <p className="text-center text-sm text-muted mt-6">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-accent hover:underline">
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}
```

---

## 11. GAUNTLET MODE — `app/gauntlet/page.tsx`

The flagship mode. Player goes through all 5 games in sequence. One wrong answer = eliminated.

```tsx
"use client";
import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import GauntletRunner from "@/components/gauntlet/GauntletRunner";
import GauntletResult from "@/components/gauntlet/GauntletResult";
import Button from "@/components/shared/Button";
import type { GameId } from "@/types";

const GAME_ORDER: GameId[] = ["wordless", "songless", "moreless", "clueless", "spellingbee"];

export default function GauntletPage() {
  const { user } = useAuthStore();
  const [started, setStarted] = useState(false);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [results, setResults] = useState<Record<GameId, "win" | "loss">>({} as any);
  const [eliminated, setEliminated] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleGameComplete = (gameId: GameId, result: "win" | "loss") => {
    setResults((prev) => ({ ...prev, [gameId]: result }));

    if (result === "loss") {
      setEliminated(true);
      setCompleted(true);
    } else if (currentGameIndex >= GAME_ORDER.length - 1) {
      setCompleted(true);
    } else {
      setCurrentGameIndex((i) => i + 1);
    }
  };

  if (!started) {
    return (
      <div className="pt-6 flex flex-col items-center justify-center min-h-[80vh] text-center">
        <h1 className="font-display text-4xl font-bold neon-text-pink mb-4">THE GAUNTLET</h1>
        <p className="text-muted max-w-xs mb-2">
          Play all 5 games back-to-back. One wrong answer and you're out.
        </p>
        <p className="text-accent text-sm mb-8">Can you survive them all?</p>
        <Button variant="secondary" size="lg" glow onClick={() => setStarted(true)}>
          ⚔️ Begin Gauntlet
        </Button>
      </div>
    );
  }

  if (completed) {
    const survived = !eliminated;
    return (
      <GauntletResult
        results={results}
        survived={survived}
        gameOrder={GAME_ORDER}
      />
    );
  }

  return (
    <GauntletRunner
      gameId={GAME_ORDER[currentGameIndex]}
      gameIndex={currentGameIndex}
      totalGames={GAME_ORDER.length}
      onComplete={handleGameComplete}
    />
  );
}
```

---

## 12. SHARE SYSTEM

### `lib/utils.ts` — Share text generators

```typescript
export function generateWordlessShareText(
  puzzleNumber: number,
  guesses: string[][],
  won: boolean,
  maxGuesses: number
): string {
  const grid = guesses
    .map((row) =>
      row
        .map((state) => {
          if (state === "correct") return "🟩";
          if (state === "present") return "🟨";
          return "⬛";
        })
        .join("")
    )
    .join("\n");

  return `🟪 GAUNTLET — Wordless #${puzzleNumber}\n${won ? guesses.length : "X"}/${maxGuesses}\n\n${grid}\n\nPlay at gauntlet.gg`;
}

export function generateGauntletShareText(
  survived: boolean,
  completedCount: number,
  total: number,
  streak: number
): string {
  const swords = survived ? "⚔️" : "💀";
  const bars = Array.from({ length: total }, (_, i) =>
    i < completedCount ? "🟩" : "🟥"
  ).join("");

  return `${swords} GAUNTLET — ${survived ? "SURVIVED" : "ELIMINATED"}\n${bars}\n${completedCount}/${total} games cleared${streak > 1 ? ` | 🔥 ${streak}-day streak` : ""}\n\nPlay at gauntlet.gg`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
```

---

## 13. ADMIN DASHBOARD — `app/admin/page.tsx`

A simple admin page (protect with a hardcoded admin UID check or Firebase custom claims).

**Features to implement:**
1. **Daily Content Editor:** Form to set each day's puzzle content (word, song, pairs, etc.) and write it to `dailyContent/{date}` in Firestore.
2. **User Count:** Read total user count from Firestore.
3. **Ad Slot Manager:** Simple table showing ad slot IDs and toggles. Store in Firestore `config/ads`.
4. **Revenue placeholder:** Display a note to check Google AdSense dashboard for revenue data (revenue data comes from AdSense, not from the app).

**Auth check:** Compare `user.uid` against an env variable `NEXT_PUBLIC_ADMIN_UID` or a Firestore `admins` collection.

---

## 14. API ROUTES (Next.js Route Handlers)

### `app/api/daily/route.ts`

Returns today's game content. The client calls this on load. For MVP, content is stored in Firestore and fetched here. In production, a cron job (Vercel Cron or Firebase Functions) auto-generates daily content.

```typescript
import { NextResponse } from "next/server";
import { getDailyContent } from "@/lib/db";

export async function GET() {
  const content = await getDailyContent();
  if (!content) {
    return NextResponse.json({ error: "No content for today" }, { status: 404 });
  }
  return NextResponse.json(content);
}
```

### `app/api/leaderboard/route.ts`

```typescript
import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "daily";
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const entries = await getLeaderboard(period, date);
  return NextResponse.json(entries);
}
```

---

## 15. DATA SEEDING

For development, seed `data/` JSON files with sample content:

- **`wordless-words.json`**: Use a standard Wordle word list. At minimum include 2000+ common 5-letter English words. Freely available lists exist.
- **`songless-songs.json`**: Seed with 100+ entries. Each entry: `{ id, title, artist, genre, year }`. Audio snippets would need to be hosted separately (use placeholder URLs for dev).
- **`moreless-pairs.json`**: Seed with 200+ pairs across categories: Google search volume, calories, population, box office, etc.
- **`clueless-words.json`**: Seed with 365 target words (one per day for a year). Precompute top-1000 similarity scores per word using a word2vec or GloVe model, or use a simple API during dev.
- **`spellingbee-words.json`**: 365 sets of 5 words each, graded by difficulty.

---

## 16. DEPLOYMENT CHECKLIST

1. Create Firebase project → Enable Auth (Email, Google) → Create Firestore database
2. Set all env vars in Vercel dashboard
3. Apply Firestore security rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /users/{uid}/history/{date} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /dailyContent/{date} {
      allow read: if true;
      allow write: if false; // admin SDK only
    }
    match /leaderboards/{id} {
      allow read: if true;
      allow write: if false; // admin SDK only
    }
  }
}
```
4. Set up Google AdSense account → Create ad units → Get slot IDs → Set in env/config
5. Deploy to Vercel: `vercel --prod`
6. Set up a daily cron job (Vercel Cron or external) to generate and write daily content to Firestore

---

## 17. BUILD ORDER (Suggested for Claude Code)

Execute in this order to build incrementally and test along the way:

1. **Bootstrap:** `create-next-app`, install deps, set up tailwind config, globals.css, layout.tsx
2. **Design system:** Button, Card, GlowText, AnimatedBackground, BottomNav
3. **Firebase + Auth:** firebase.ts, auth store, login page, AuthGuard
4. **Home page:** GameCard, GameGrid, GauntletBanner, home page
5. **Wordless:** Full game implementation (board, keyboard, tile animations, daily word logic, result saving)
6. **Songless:** Audio player, search autocomplete, progressive snippet reveal
7. **More/Less:** Card comparison UI, streak tracking, animation on reveal
8. **Clueless:** Input, similarity meter, guess history sorted by score
9. **Spelling Bee:** Audio playback, text input, progress indicator
10. **Gauntlet mode:** GauntletRunner orchestration, progress bar, elimination flow, result screen
11. **Profile page:** Stats grid, streak display, XP bar, unlocks
12. **Leaderboard page:** Table, tabs, data fetching
13. **Ads:** BannerAd, InterstitialAd, RewardedAdButton, ad frequency logic
14. **Share system:** Share card generation, clipboard copy, social share buttons
15. **Admin dashboard:** Content editor, user stats, ad management
16. **Polish:** Animations, loading states, error handling, offline support, PWA manifest

---

*This spec is complete. Claude Code should be able to execute this document top-to-bottom to produce a fully functional Gauntlet web app.*
