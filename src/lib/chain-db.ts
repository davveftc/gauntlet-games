import { supabase } from "./supabase";
import { createNotification } from "./notifications-db";
import type { Chain, ChainLink, ChainGameId } from "@/types";
import { CHAIN_GAMES } from "@/types";

const todayStr = () => new Date().toISOString().split("T")[0];

const CHAIN_MULTIPLIER = 4;
const TOTAL_LINKS = 6;

// ---- HELPERS ----

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function mapChainRow(row: Record<string, unknown>): Omit<Chain, "links"> {
  return {
    id: row.id as string,
    date: row.date as string,
    status: row.status as Chain["status"],
    currentLinkIndex: row.current_link_index as number,
    totalScore: row.total_score as number,
    createdAt: row.created_at as string,
    completedAt: (row.completed_at as string) || undefined,
  };
}

function mapLinkRow(row: Record<string, unknown>): ChainLink {
  return {
    id: row.id as number,
    chainId: row.chain_id as string,
    linkIndex: row.link_index as number,
    uid: row.uid as string,
    gameId: row.game_id as ChainGameId,
    result: row.result as ChainLink["result"],
    score: row.score as number,
    startedAt: (row.started_at as string) || undefined,
    completedAt: (row.completed_at as string) || undefined,
    nominatedNextUid: (row.nominated_next_uid as string) || undefined,
  };
}

// ---- GET CHAIN ----
export async function getChain(chainId: string): Promise<Chain | null> {
  const { data: chainRow, error } = await supabase
    .from("chains")
    .select("*")
    .eq("id", chainId)
    .single();

  if (error || !chainRow) return null;

  const { data: linkRows } = await supabase
    .from("chain_links")
    .select("*")
    .eq("chain_id", chainId)
    .order("link_index", { ascending: true });

  const links = (linkRows || []).map(mapLinkRow);

  // Enrich links with player display names
  const uids = [...new Set(links.map((l) => l.uid))];
  if (uids.length > 0) {
    const { data: profiles } = await supabase
      .from("users")
      .select("uid, display_name, avatar")
      .in("uid", uids);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.uid, p])
    );

    for (const link of links) {
      const profile = profileMap.get(link.uid);
      if (profile) {
        link.displayName = profile.display_name;
        link.avatar = profile.avatar;
      }
    }
  }

  return { ...mapChainRow(chainRow), links };
}

// ---- GET USER'S CHAIN FOR TODAY ----
export async function getUserChainForToday(uid: string): Promise<Chain | null> {
  const today = todayStr();

  // Find any chain link for this user today
  const { data: linkRows } = await supabase
    .from("chain_links")
    .select("chain_id")
    .eq("uid", uid);

  if (!linkRows || linkRows.length === 0) return null;

  const chainIds = [...new Set(linkRows.map((r) => r.chain_id))];

  // Check which of these chains are for today
  const { data: chains } = await supabase
    .from("chains")
    .select("id")
    .in("id", chainIds)
    .eq("date", today)
    .limit(1);

  if (!chains || chains.length === 0) return null;

  return getChain(chains[0].id);
}

// ---- CREATE CHAIN ----
export async function createChain(creatorUid: string): Promise<{ chain: Chain | null; error?: string }> {
  // Check if user already has a chain today
  const existing = await getUserChainForToday(creatorUid);
  if (existing) return { chain: existing, error: "already_exists" };

  // Shuffle all 6 games to assign randomly
  const shuffledGames = shuffleArray(CHAIN_GAMES);

  // Create the chain
  const { data: chainRow, error } = await supabase
    .from("chains")
    .insert({
      date: todayStr(),
      status: "in_progress",
      current_link_index: 0,
      total_score: 0,
    })
    .select()
    .single();

  if (error || !chainRow) {
    console.error("Failed to create chain:", error);
    return { chain: null, error: "db_error" };
  }

  // Create first link assigned to the creator
  const { error: linkError } = await supabase.from("chain_links").insert({
    chain_id: chainRow.id,
    link_index: 0,
    uid: creatorUid,
    game_id: shuffledGames[0],
    result: "pending",
    score: 0,
  });

  if (linkError) {
    console.error("Failed to create chain link:", linkError);
    // Clean up the orphaned chain
    await supabase.from("chains").delete().eq("id", chainRow.id);
    return { chain: null, error: "db_error" };
  }

  // Pre-assign game IDs for all 6 links (players TBD for links 1-5)
  // Store game assignments in the chain for later link creation
  // We'll create links 1-5 as players are nominated

  const chain = await getChain(chainRow.id);
  return { chain };
}

// ---- GET AVAILABLE GAMES FOR CHAIN ----
export async function getAvailableGames(chainId: string): Promise<ChainGameId[]> {
  const { data: links } = await supabase
    .from("chain_links")
    .select("game_id")
    .eq("chain_id", chainId);

  const usedGames = new Set((links || []).map((l) => l.game_id));
  return CHAIN_GAMES.filter((g) => !usedGames.has(g));
}

// ---- START A LINK (mark as playing) ----
export async function startLink(chainId: string, linkIndex: number): Promise<void> {
  await supabase
    .from("chain_links")
    .update({
      result: "playing",
      started_at: new Date().toISOString(),
    })
    .eq("chain_id", chainId)
    .eq("link_index", linkIndex);
}

// ---- COMPLETE A LINK ----
export async function completeLink(
  chainId: string,
  linkIndex: number,
  result: "win" | "loss",
  score: number
): Promise<Chain | null> {
  // Update the link
  await supabase
    .from("chain_links")
    .update({
      result,
      score,
      completed_at: new Date().toISOString(),
    })
    .eq("chain_id", chainId)
    .eq("link_index", linkIndex);

  if (result === "loss") {
    // Chain breaks
    await supabase
      .from("chains")
      .update({
        status: "broken",
        total_score: 0,
        completed_at: new Date().toISOString(),
      })
      .eq("id", chainId);

    // Notify all participants
    const chain = await getChain(chainId);
    if (chain) {
      const brokenLink = chain.links.find((l) => l.linkIndex === linkIndex);
      for (const link of chain.links) {
        if (link.uid !== brokenLink?.uid) {
          await createNotification(
            link.uid,
            "chain_result",
            "Chain Broken!",
            `${brokenLink?.displayName || "A player"} lost at ${getGameName(brokenLink?.gameId || "songless")}. The chain is broken.`,
            { chainId }
          );
        }
      }
    }

    return getChain(chainId);
  }

  // Win — check if this was the last link
  if (linkIndex >= TOTAL_LINKS - 1) {
    // Chain completed! Calculate total score
    const chain = await getChain(chainId);
    if (!chain) return null;

    const rawTotal = chain.links.reduce((sum, l) => sum + l.score, 0);
    const totalScore = rawTotal * CHAIN_MULTIPLIER;

    await supabase
      .from("chains")
      .update({
        status: "completed",
        total_score: totalScore,
        completed_at: new Date().toISOString(),
      })
      .eq("id", chainId);

    // Notify all participants
    for (const link of chain.links) {
      await createNotification(
        link.uid,
        "chain_result",
        "Chain Survived!",
        `All 6 links held! Total score: ${totalScore} (${CHAIN_MULTIPLIER}x multiplier)`,
        { chainId, totalScore }
      );
    }

    return getChain(chainId);
  }

  // Advance to next link
  await supabase
    .from("chains")
    .update({ current_link_index: linkIndex + 1 })
    .eq("id", chainId);

  return getChain(chainId);
}

// ---- NOMINATE NEXT PLAYER ----
export async function nominateNextPlayer(
  chainId: string,
  currentLinkIndex: number,
  nextUid: string
): Promise<Chain | null> {
  const nextIndex = currentLinkIndex + 1;
  if (nextIndex >= TOTAL_LINKS) return getChain(chainId);

  // Mark nomination on current link
  await supabase
    .from("chain_links")
    .update({ nominated_next_uid: nextUid })
    .eq("chain_id", chainId)
    .eq("link_index", currentLinkIndex);

  // Pick a random available game
  const available = await getAvailableGames(chainId);
  const gameId = available.length > 0
    ? available[Math.floor(Math.random() * available.length)]
    : CHAIN_GAMES[Math.floor(Math.random() * CHAIN_GAMES.length)];

  // Create the next link
  await supabase.from("chain_links").insert({
    chain_id: chainId,
    link_index: nextIndex,
    uid: nextUid,
    game_id: gameId,
    result: "pending",
    score: 0,
  });

  // Get the chain to find current player's name
  const chain = await getChain(chainId);
  const currentLink = chain?.links.find((l) => l.linkIndex === currentLinkIndex);

  // Notify the nominated player
  await createNotification(
    nextUid,
    "chain_turn",
    "Your Turn in The Chain!",
    `${currentLink?.displayName || "A friend"} won their game! Now it's your turn to play ${getGameName(gameId)}.`,
    { chainId, linkIndex: nextIndex, gameId }
  );

  return chain;
}

// ---- AUTO-CYCLE: assign next player from existing participants ----
export async function cycleNextPlayer(
  chainId: string,
  currentLinkIndex: number
): Promise<Chain | null> {
  const chain = await getChain(chainId);
  if (!chain) return null;

  const nextIndex = currentLinkIndex + 1;
  if (nextIndex >= TOTAL_LINKS) return chain;

  // Round-robin: pick the participant at nextIndex % numParticipants
  const uniqueUids = [...new Set(chain.links.map((l) => l.uid))];
  const nextUid = uniqueUids[nextIndex % uniqueUids.length];

  return nominateNextPlayer(chainId, currentLinkIndex, nextUid);
}

// ---- SUBSCRIBE TO CHAIN UPDATES (Realtime) ----
export function subscribeToChain(
  chainId: string,
  onUpdate: (chain: Chain) => void
) {
  const channel = supabase
    .channel(`chain-${chainId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "chain_links",
        filter: `chain_id=eq.${chainId}`,
      },
      async () => {
        const updated = await getChain(chainId);
        if (updated) onUpdate(updated);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "chains",
        filter: `id=eq.${chainId}`,
      },
      async () => {
        const updated = await getChain(chainId);
        if (updated) onUpdate(updated);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ---- HELPER: Game display names ----
function getGameName(gameId: string): string {
  const names: Record<string, string> = {
    songless: "Songless",
    sayless: "Say Less",
    moreless: "More/Less",
    clueless: "Clueless",
    spellingbee: "Spelling Bee",
    faceless: "Faceless",
  };
  return names[gameId] || gameId;
}
