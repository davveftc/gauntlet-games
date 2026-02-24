"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { GauntletProvider } from "@/context/GauntletContext";
import Modal from "@/components/shared/Modal";
import Button from "@/components/shared/Button";
import type { GameId, GameResult } from "@/types";

/* ------------------------------------------------------------------ */
/*  Dynamically import each game page component                        */
/* ------------------------------------------------------------------ */
const GameComponents: Record<GameId, React.ComponentType> = {
  wordless: dynamic(() => import("@/app/play/songless/page"), { ssr: false }), // archived – placeholder
  songless: dynamic(() => import("@/app/play/songless/page"), { ssr: false }),
  sayless: dynamic(() => import("@/app/play/sayless/page"), { ssr: false }),
  moreless: dynamic(() => import("@/app/play/moreless/page"), { ssr: false }),
  clueless: dynamic(() => import("@/app/play/clueless/page"), { ssr: false }),
  spellingbee: dynamic(() => import("@/app/play/spellingbee/page"), { ssr: false }),
  faceless: dynamic(() => import("@/app/play/faceless/page"), { ssr: false }),
};

/* ------------------------------------------------------------------ */
/*  Runner                                                             */
/* ------------------------------------------------------------------ */
interface GauntletRunnerProps {
  gameId: GameId;
  gameIndex: number;
  totalGames: number;
  onComplete: (gameId: GameId, result: "win" | "loss", score?: number) => void;
}

export default function GauntletRunner({
  gameId,
  gameIndex,
  totalGames,
  onComplete,
}: GauntletRunnerProps) {
  const router = useRouter();
  const [showForfeit, setShowForfeit] = useState(false);
  const GameComponent = GameComponents[gameId];

  const handleComplete = (gId: GameId, result: GameResult, score?: number) => {
    onComplete(gId, result as "win" | "loss", score);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="w-8" />
        <div className="text-center">
          <span className="text-xs text-muted uppercase tracking-widest">Gauntlet Mode</span>
          <h2 className="font-display text-xl font-bold neon-text-pink">
            Game {gameIndex + 1} of {totalGames}
          </h2>
        </div>
        <button
          onClick={() => setShowForfeit(true)}
          className="flex items-center justify-center p-2 rounded-lg text-muted hover:text-white hover:bg-primary/20 transition-colors"
        >
          <X size={22} />
        </button>
      </div>

      <GauntletProvider onComplete={handleComplete}>
        <GameComponent />
      </GauntletProvider>

      <Modal
        isOpen={showForfeit}
        onClose={() => setShowForfeit(false)}
        title="Leave Gauntlet?"
      >
        <p className="text-muted mb-6">
          If you leave now, you&apos;ll forfeit the gauntlet and lose all progress.
        </p>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            size="md"
            onClick={() => setShowForfeit(false)}
            className="flex-1"
          >
            Stay
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => router.push("/")}
            className="flex-1"
          >
            Leave
          </Button>
        </div>
      </Modal>
    </div>
  );
}
