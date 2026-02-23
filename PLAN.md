# The Chain — Implementation Plan

## Overview

"The Chain" is a cooperative multiplayer mode where up to 6 players take turns playing one game each in sequence. If every player wins their game, all participants share a combined score with a 4× multiplier. If any player loses, the chain breaks and everyone gets 0 points.

---

## Step 1: Database Schema (New Tables)

Add to `supabase/schema.sql`:

### `friends` table
```sql
- id (bigint, primary key)
- uid (uuid, FK → users) — the user who sent the request
- friend_uid (uuid, FK → users) — the friend
- created_at (timestamptz)
- unique(uid, friend_uid)
```

### `friend_requests` table
```sql
- id (bigint, primary key)
- from_uid (uuid, FK → users)
- to_uid (uuid, FK → users)
- status (text) — 'pending', 'accepted', 'rejected'
- created_at (timestamptz)
- unique(from_uid, to_uid)
```

### `chains` table
```sql
- id (uuid, primary key, default gen_random_uuid())
- date (date) — the day this chain belongs to
- status (text) — 'in_progress', 'completed', 'broken'
- current_link_index (integer, default 0) — which link is active (0-5)
- total_score (integer, default 0)
- created_at (timestamptz)
- completed_at (timestamptz, nullable)
```

### `chain_links` table
```sql
- id (bigint, primary key)
- chain_id (uuid, FK → chains)
- link_index (integer) — 0-5 position in the chain
- uid (uuid, FK → users) — player assigned to this link
- game_id (text) — which game they play (one of the 6, excluding wordless)
- result (text) — 'pending', 'playing', 'win', 'loss'
- score (integer, default 0)
- started_at (timestamptz, nullable)
- completed_at (timestamptz, nullable)
- nominated_next_uid (uuid, nullable, FK → users) — who they nominated for the next link
- unique(chain_id, link_index)
```

### `notifications` table
```sql
- id (bigint, primary key)
- uid (uuid, FK → users) — recipient
- type (text) — 'chain_invite', 'chain_turn', 'chain_result', 'friend_request'
- title (text)
- body (text)
- data (jsonb) — { chainId, linkIndex, gameId, etc. }
- read (boolean, default false)
- email_sent (boolean, default false)
- created_at (timestamptz)
```

**RLS Policies:**
- `friends`: Users can read/write their own rows
- `friend_requests`: Users can read rows where they are from_uid or to_uid; write where they are from_uid
- `chains`: Participants can read; creator can write
- `chain_links`: Participants of the chain can read; the assigned player can update their own link
- `notifications`: Users can only read their own

---

## Step 2: TypeScript Types

Add to `src/types/index.ts`:

```typescript
// Chain games = all games except wordless
type ChainGameId = Exclude<GameId, "wordless">;

interface Chain {
  id: string;
  date: string;
  status: "in_progress" | "completed" | "broken";
  currentLinkIndex: number;
  totalScore: number;
  links: ChainLink[];
  createdAt: string;
  completedAt?: string;
}

interface ChainLink {
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

interface Friend {
  uid: string;
  displayName: string;
  avatar: string;
}

interface FriendRequest {
  id: number;
  fromUid: string;
  fromDisplayName: string;
  toUid: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

interface Notification {
  id: number;
  uid: string;
  type: "chain_invite" | "chain_turn" | "chain_result" | "friend_request";
  title: string;
  body: string;
  data: Record<string, any>;
  read: boolean;
  createdAt: string;
}

// XP rewards addition
// Add to XP_REWARDS:
//   COMPLETE_CHAIN: 300,
//   SURVIVE_CHAIN: 500,
```

---

## Step 3: Database Functions

Create `src/lib/chain-db.ts`:

### Chain CRUD
- `createChain(creatorUid: string): Promise<Chain>` — Creates chain, assigns creator as link 0 with random game
- `getChain(chainId: string): Promise<Chain | null>` — Fetches chain with all links + player display names
- `getUserChainForToday(uid: string): Promise<Chain | null>` — Check if user is already in a chain today
- `getAvailableGames(chainId: string): ChainGameId[]` — Returns games not yet assigned in this chain

### Chain Link Operations
- `startLink(chainId: string, linkIndex: number): Promise<void>` — Mark link as 'playing', set startedAt
- `completeLink(chainId: string, linkIndex: number, result: "win" | "loss", score: number): Promise<void>` — Update link result/score; if loss → set chain status='broken'; if win and last link → set chain status='completed' and calculate totalScore
- `nominateNextPlayer(chainId: string, linkIndex: number, nextUid: string): Promise<ChainLink>` — Assign next player to next link with random available game; create notification

### Chain Cycling Logic
When fewer than 6 unique players, the chain cycles:
- After link N completes, if no nomination or cycling needed, assign next game to players in order starting from the first player
- `getNextPlayerForCycling(chain: Chain): string` — Determines which player goes next based on round-robin

### Friend Operations (in `src/lib/friends-db.ts`)
- `sendFriendRequest(fromUid: string, toUsername: string): Promise<void>`
- `respondToFriendRequest(requestId: number, accept: boolean): Promise<void>`
- `getFriends(uid: string): Promise<Friend[]>`
- `getFriendRequests(uid: string): Promise<FriendRequest[]>`
- `removeFriend(uid: string, friendUid: string): Promise<void>`
- `searchUsers(query: string): Promise<{uid: string, displayName: string}[]>`

### Notification Operations (in `src/lib/notifications-db.ts`)
- `createNotification(uid: string, type: string, title: string, body: string, data: object): Promise<void>`
- `getNotifications(uid: string, unreadOnly?: boolean): Promise<Notification[]>`
- `markNotificationRead(notificationId: number): Promise<void>`
- `markAllRead(uid: string): Promise<void>`
- `sendChainEmail(toEmail: string, subject: string, body: string): Promise<void>` — Uses Supabase Edge Function or a simple email API

---

## Step 4: Chain Context (like GauntletContext)

Create `src/context/ChainContext.tsx`:

```typescript
interface ChainContextValue {
  isChain: boolean;
  chainId: string | null;
  linkIndex: number;
  onComplete: (gameId: ChainGameId, result: "win" | "loss", score?: number) => void;
}
```

- Wraps game components similar to `GauntletContext`
- Games check `useChainContext()` alongside `useGauntletContext()` to know they're in chain mode
- Chain mode behavior = same as gauntlet mode (strict win conditions)

---

## Step 5: Chain Components

### `src/components/chain/ChainStart.tsx`
- Entry point for starting a chain
- Checks if user already has a chain today → redirects to progress view
- "Start a Chain" button → creates chain, shows first game assignment
- After game selection is auto-random, show the assigned game and "Play" button

### `src/components/chain/ChainRunner.tsx` (modeled after GauntletRunner)
- Receives `chainId`, `linkIndex`, and the assigned `gameId`
- Dynamically imports the correct game component
- Wraps in `ChainProvider`
- On game complete → calls `completeLink()` → shows nomination UI or result

### `src/components/chain/ChainNominate.tsx`
- After winning a game, player nominates the next friend
- Shows friend list with search
- Friends already in the chain today are greyed out (can't join another chain)
- If no nomination needed (cycling mode or final link), skip this step
- "Nominate" button → calls `nominateNextPlayer()`, sends notification + email

### `src/components/chain/ChainProgress.tsx` (Spectator View)
- Shows all 6 links as a visual chain
- Each link shows:
  - Player name + avatar
  - Game icon
  - Status: pending (grey), playing (blue pulse), win (green ✓), loss (red ✗)
  - Round-level detail per game (expandable):
    - Songless: 4 round indicators
    - Say Less: 4 movie indicators
    - More/Less: 3 category indicators with score per category
    - Clueless: guess count
    - Spelling Bee: 5 word indicators
    - Faceless: 6 celebrity indicators with points per celebrity
- Real-time updates via Supabase realtime subscriptions on `chain_links` table
- Countdown timer showing chain expiry (UTC midnight)

### `src/components/chain/ChainResult.tsx` (modeled after GauntletResult)
- Shows when chain completes or breaks
- Survived: confetti, total score with ×4 multiplier breakdown, all player results
- Broken: shows which link broke, sadder UI
- Share button with chain share text
- XP awarded display

### `src/components/chain/ChainCard.tsx`
- Small card component for showing chain status on home/dashboard
- Shows: chain progress, current player, your game result

---

## Step 6: Friend System Components

### `src/components/friends/FriendList.tsx`
- Shows current friends with search/filter
- Each friend shows: avatar, display name, online status (optional)
- Remove friend button

### `src/components/friends/AddFriend.tsx`
- Search by username input
- Shows search results with "Add Friend" button
- Shows pending sent requests

### `src/components/friends/FriendRequests.tsx`
- Shows incoming friend requests
- Accept/Reject buttons

---

## Step 7: Notification System

### `src/components/notifications/NotificationBell.tsx`
- Bell icon in header/nav
- Badge showing unread count
- Dropdown showing recent notifications
- Click to mark as read + navigate to relevant page

### `src/components/notifications/NotificationList.tsx`
- Full page notification list
- Types rendered differently:
  - `chain_turn`: "It's your turn in The Chain! [Player] won [Game]. Play [YourGame] now!" → links to chain runner
  - `chain_result`: "The Chain survived!" or "The Chain broke..." → links to chain result
  - `friend_request`: "[Player] wants to be friends" → accept/reject inline

### Email Notifications
- Create Supabase Edge Function `send-chain-email` at `supabase/functions/send-chain-email/index.ts`
- Triggered when a notification is created for chain events
- Uses Supabase's built-in email or Resend/SendGrid integration
- Email templates:
  - Chain turn: "It's your turn! [PrevPlayer] won [Game]. You're playing [YourGame]."
  - Chain result: "Your chain [survived/broke]! Final score: X"

---

## Step 8: Pages/Routes

### `src/app/chain/page.tsx` — Main Chain Page
- If no active chain today → show ChainStart
- If active chain and it's your turn → show ChainRunner
- If active chain and not your turn → show ChainProgress (spectator)
- If chain completed/broken → show ChainResult

### `src/app/chain/[chainId]/page.tsx` — Chain Detail/Progress
- Direct link to a specific chain's progress view
- Used in notification links

### `src/app/friends/page.tsx` — Friends Management
- Tabs: Friends List | Friend Requests | Add Friend

### `src/app/notifications/page.tsx` — Notifications Page
- Full notification history

---

## Step 9: Game Integration

Each game already checks `useGauntletContext()` for gauntlet mode. We add a parallel check:

### Modify `src/hooks/useGame.ts`
- Import `useChainContext`
- In `completeGame()`: if `isChain`, call `chainContext.onComplete()` instead of saving to regular game history
- Chain games save to `chain_links` table, not `game_history`

### Modify each game page (6 games, NOT wordless)
Each game page in `src/app/play/{game}/page.tsx` already has:
```typescript
const { isGauntlet } = useGauntletContext();
```

Add alongside:
```typescript
const { isChain } = useChainContext();
```

Game behavior in chain mode = same as gauntlet mode (strict win conditions). So we update conditionals from `if (isGauntlet)` to `if (isGauntlet || isChain)`.

---

## Step 10: Scoring & XP

### Chain Score Calculation
```
totalScore = (link0.score + link1.score + ... + link5.score) × 4
```
- Only awarded if chain status = 'completed' (all 6 wins)
- If chain breaks → totalScore = 0

### XP Awards (per participant)
- Chain completed (any result): `COMPLETE_CHAIN = 300 XP`
- Chain survived (all wins): `SURVIVE_CHAIN = 500 XP`
- Add chain streak tracking: `game_id = 'chain'` in streaks table

---

## Step 11: Navigation Updates

### Update main navigation/layout
- Add "Chain" link to nav alongside "Play", "Gauntlet", "Leaderboard", "Profile"
- Add notification bell component to header
- Add "Friends" link (can be in profile dropdown or nav)

---

## Step 12: Share Functionality

### `src/lib/utils.ts` — Add chain share text
```typescript
function generateChainShareText(
  survived: boolean,
  playerCount: number,
  totalScore: number,
  links: { gameId: string; result: string; displayName: string }[]
): string
```

Format:
```
🔗 The Chain — gauntlet.gg
✅ Songless → ✅ Say Less → ✅ More/Less → ❌ Clueless
Chain Broken at Link 4/6
```
or
```
🔗 The Chain — gauntlet.gg
✅✅✅✅✅✅ ALL LINKS HELD!
Total Score: 1,240 (×4 = 4,960)
```

---

## Implementation Order

1. **Database schema** — Add new tables + RLS policies
2. **Types** — Add TypeScript interfaces
3. **Friend system** — DB functions + components + page (needed before chain nomination)
4. **Notification system** — DB functions + components + email edge function
5. **Chain DB functions** — CRUD, link operations, cycling logic
6. **Chain context** — ChainContext provider (parallel to GauntletContext)
7. **Chain components** — Start, Runner, Nominate, Progress, Result
8. **Chain page** — Main route with state-based rendering
9. **Game integration** — Add `isChain` checks to all 6 game pages + useGame hook
10. **Navigation** — Add Chain + notifications to layout
11. **Scoring & XP** — Wire up chain scoring and XP rewards
12. **Share** — Chain share text generation
13. **Testing & polish** — End-to-end flow testing

---

## Key Architecture Decisions

- **Server-side state**: Unlike Gauntlet (client-side), Chain state lives in the database since multiple players interact asynchronously
- **Supabase Realtime**: Used for the spectator/progress view to show live updates as other players complete their games
- **Chain mode reuses gauntlet behavior**: Games don't need new logic — `isChain` triggers the same strict win conditions as `isGauntlet`
- **Cycling logic**: If fewer than 6 unique friends, players rotate. The chain always has exactly 6 links (games), but may have fewer unique players
- **One chain per day per user**: Enforced at DB level (check `chain_links` for user + today's date before allowing join/create)
