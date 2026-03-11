"use client";
import { motion } from "framer-motion";
import { Link2, Unlink } from "lucide-react";
import Button from "@/components/shared/Button";
import ShareButton from "@/components/shared/ShareButton";
import CountdownTimer from "@/components/shared/CountdownTimer";
import ConfettiExplosion from "@/components/shared/ConfettiExplosion";
import { generateChainShareText } from "@/lib/utils";
import type { Chain } from "@/types";
import Link from "next/link";

const GAME_NAMES: Record<string, string> = {
  songless: "Songless",
  sayless: "Say Less",
  moreless: "More/Less",
  clueless: "Clueless",
  spellingbee: "Spelling Bee",
  faceless: "Faceless",
};

interface ChainResultProps {
  chain: Chain;
  currentUid?: string;
}

export default function ChainResult({ chain, currentUid }: ChainResultProps) {
  const survived = chain.status === "completed";
  const completedCount = chain.links.filter((l) => l.result === "win").length;

  const shareText = generateChainShareText(
    survived,
    chain.links.length,
    chain.totalScore,
    chain.links.map((l) => ({
      gameId: l.gameId,
      result: l.result,
      displayName: l.displayName || "Player",
    }))
  );

  return (
    <div className="pt-6 text-center">
      <ConfettiExplosion trigger={survived} />

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 10 }}
        className="mb-6"
      >
        {survived ? (
          <div className="w-24 h-24 mx-auto rounded-full bg-success/20 border-2 border-success flex items-center justify-center mb-4">
            <Link2 size={48} className="text-success" />
          </div>
        ) : (
          <div className="w-24 h-24 mx-auto rounded-full bg-error/20 border-2 border-error flex items-center justify-center mb-4">
            <Unlink size={48} className="text-error" />
          </div>
        )}
      </motion.div>

      <h1
        className={`font-display text-3xl font-bold mb-2 ${
          survived ? "neon-text-gold" : "neon-text-pink"
        }`}
      >
        {survived ? "CHAIN SURVIVED!" : "CHAIN BROKEN"}
      </h1>

      {survived ? (
        <div className="mb-6">
          <p className="text-muted mb-3">
            All 6 links held strong!
          </p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-block px-5 py-3 rounded-xl bg-accent/15 border border-accent/30"
          >
            <p className="font-display text-3xl font-bold text-accent">
              {chain.totalScore}
              <span className="text-lg text-accent/60 ml-1">pts</span>
            </p>
            <p className="text-xs text-muted mt-1">
              4x multiplier applied
            </p>
          </motion.div>
          <div className="mt-4">
            <CountdownTimer />
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <p className="text-muted mb-1">
            The chain broke at link {completedCount + 1} of 6
          </p>
          <p className="font-display text-2xl font-bold text-error/70 mb-4">
            0 points
          </p>
          <CountdownTimer />
        </div>
      )}

      {/* Link results */}
      <div className="space-y-2 mb-8 max-w-xs mx-auto">
        {chain.links.map((link) => {
          const isYou = link.uid === currentUid;
          return (
            <motion.div
              key={link.linkIndex}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: link.linkIndex * 0.08 }}
              className={`flex items-center justify-between py-2 px-4 rounded-lg ${
                link.result === "win"
                  ? "bg-success/10 border border-success/30"
                  : link.result === "loss"
                  ? "bg-error/10 border border-error/30"
                  : "bg-surface/30 border border-dim/20"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium truncate">
                  {link.displayName || "Player"}{isYou && " (You)"}
                </span>
                <span className="text-xs text-muted">
                  {GAME_NAMES[link.gameId]}
                </span>
              </div>
              <span
                className={`text-sm font-bold ${
                  link.result === "win"
                    ? "text-success"
                    : link.result === "loss"
                    ? "text-error"
                    : "text-dim"
                }`}
              >
                {link.result === "win"
                  ? `+${link.score}`
                  : link.result === "loss"
                  ? "Failed"
                  : "-"}
              </span>
            </motion.div>
          );
        })}
      </div>

      <div className="space-y-3">
        <ShareButton text={shareText} />
        <Link href="/">
          <Button variant="ghost" size="md">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
