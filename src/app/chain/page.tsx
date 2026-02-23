"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import {
  createChain,
  getChain,
  getUserChainForToday,
  startLink,
  completeLink,
  nominateNextPlayer,
  cycleNextPlayer,
  subscribeToChain,
} from "@/lib/chain-db";
import { addXP, updateStreak } from "@/lib/db";
import { XP_REWARDS } from "@/types";
import ChainStart from "@/components/chain/ChainStart";
import ChainRunner from "@/components/chain/ChainRunner";
import ChainProgress from "@/components/chain/ChainProgress";
import ChainNominate from "@/components/chain/ChainNominate";
import ChainResult from "@/components/chain/ChainResult";
import AuthGuard from "@/components/auth/AuthGuard";
import type { Chain, GameId } from "@/types";

type Phase = "loading" | "start" | "playing" | "nominating" | "spectating" | "result";

export default function ChainPage() {
  const { user } = useAuthStore();
  const [chain, setChain] = useState<Chain | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [startLoading, setStartLoading] = useState(false);

  // Determine the phase based on chain state
  const determinePhase = useCallback(
    (c: Chain | null): Phase => {
      if (!c) return "start";
      if (!user) return "loading";

      if (c.status === "completed" || c.status === "broken") return "result";

      // Find user's link in the chain
      const myLink = c.links.find(
        (l) => l.uid === user.uid && (l.result === "pending" || l.result === "playing")
      );

      // Check if it's user's turn
      const currentLink = c.links.find((l) => l.linkIndex === c.currentLinkIndex);

      if (currentLink && currentLink.uid === user.uid) {
        if (currentLink.result === "pending" || currentLink.result === "playing") {
          return "playing";
        }
        if (currentLink.result === "win") {
          // Just won — check if we need to nominate
          if (c.currentLinkIndex < 5 && !c.links.find((l) => l.linkIndex === c.currentLinkIndex + 1)) {
            return "nominating";
          }
        }
      }

      return "spectating";
    },
    [user]
  );

  // Load chain on mount
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const existing = await getUserChainForToday(user.uid);
      if (existing) {
        setChain(existing);
        setPhase(determinePhase(existing));
      } else {
        setPhase("start");
      }
    };
    load();
  }, [user, determinePhase]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!chain?.id) return;
    const unsub = subscribeToChain(chain.id, (updated) => {
      setChain(updated);
      setPhase(determinePhase(updated));
    });
    return unsub;
  }, [chain?.id, determinePhase]);

  // ---- HANDLERS ----

  const handleStartChain = async () => {
    if (!user) return;
    setStartLoading(true);
    const newChain = await createChain(user.uid);
    if (newChain) {
      setChain(newChain);
      setPhase("playing");
      // Auto-start the first link
      await startLink(newChain.id, 0);
      const updated = await getChain(newChain.id);
      if (updated) setChain(updated);
    }
    setStartLoading(false);
  };

  const handleGameComplete = async (
    gameId: GameId,
    result: "win" | "loss",
    score?: number
  ) => {
    if (!chain || !user) return;

    const updated = await completeLink(
      chain.id,
      chain.currentLinkIndex,
      result,
      score || 0
    );

    if (updated) {
      setChain(updated);

      // Award XP
      if (updated.status === "completed") {
        await addXP(user.uid, XP_REWARDS.SURVIVE_CHAIN);
        await updateStreak(user.uid, "chain");
      } else if (updated.status === "broken") {
        await addXP(user.uid, XP_REWARDS.COMPLETE_CHAIN);
      }

      setPhase(determinePhase(updated));
    }
  };

  const handleNominate = async (friendUid: string) => {
    if (!chain) return;
    const updated = await nominateNextPlayer(
      chain.id,
      chain.currentLinkIndex,
      friendUid
    );
    if (updated) {
      setChain(updated);
      setPhase("spectating");
    }
  };

  const handleCycle = async () => {
    if (!chain) return;
    const updated = await cycleNextPlayer(chain.id, chain.currentLinkIndex);
    if (updated) {
      setChain(updated);
      // If the cycled player is us, go to playing; otherwise spectate
      setPhase(determinePhase(updated));
    }
  };

  // Find current link info for the runner
  const currentLink = chain?.links.find((l) => l.linkIndex === chain.currentLinkIndex);

  return (
    <AuthGuard requireAuth>
      {phase === "loading" && (
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="animate-pulse text-primary-light font-display text-xl">Loading...</div>
        </div>
      )}

      {phase === "start" && (
        <ChainStart onStart={handleStartChain} loading={startLoading} />
      )}

      {phase === "playing" && chain && currentLink && (
        <div>
          <ChainProgress chain={chain} currentUid={user?.uid} />
          <ChainRunner
            chainId={chain.id}
            linkIndex={currentLink.linkIndex}
            gameId={currentLink.gameId}
            onComplete={handleGameComplete}
          />
        </div>
      )}

      {phase === "nominating" && chain && user && (
        <div>
          <ChainProgress chain={chain} currentUid={user.uid} />
          <ChainNominate
            chain={chain}
            currentUid={user.uid}
            onNominate={handleNominate}
            onCycle={handleCycle}
          />
        </div>
      )}

      {phase === "spectating" && chain && (
        <div className="pt-6">
          <div className="text-center mb-4">
            <h1 className="font-display text-2xl font-bold neon-text mb-1">THE CHAIN</h1>
            <p className="text-muted text-sm">
              Waiting for {currentLink?.displayName || "the next player"} to play...
            </p>
          </div>
          <ChainProgress chain={chain} currentUid={user?.uid} />
        </div>
      )}

      {phase === "result" && chain && (
        <ChainResult chain={chain} currentUid={user?.uid} />
      )}
    </AuthGuard>
  );
}
