"use client";
import { motion } from "framer-motion";
import { Check, X, Play, Clock } from "lucide-react";
import type { Chain, ChainGameId, GameId } from "@/types";

interface ChainProgressProps {
  chain: Chain;
  currentUid?: string;
}

const GAME_NAMES: Record<string, string> = {
  songless: "Songless",
  sayless: "Say Less",
  moreless: "More/Less",
  clueless: "Clueless",
  spellingbee: "Spelling Bee",
  faceless: "Faceless",
};

const GAME_EMOJIS: Record<string, string> = {
  songless: "\u{1F3B5}",
  sayless: "\u{1F3AC}",
  moreless: "\u{1F4CA}",
  clueless: "\u{1F50D}",
  spellingbee: "\u{1F41D}",
  faceless: "\u{1F3AD}",
};

export default function ChainProgress({ chain, currentUid }: ChainProgressProps) {
  return (
    <div className="mb-6">
      {/* Chain header */}
      <div className="text-center mb-4">
        <span className="text-xs text-muted uppercase tracking-widest">The Chain</span>
        <div className="flex items-center justify-center gap-2 mt-1">
          {chain.links.map((link, i) => {
            const isWin = link.result === "win";
            const isLoss = link.result === "loss";
            const isPlaying = link.result === "playing";
            const isPending = link.result === "pending";

            return (
              <div key={i} className="flex items-center">
                {i > 0 && (
                  <div
                    className={`w-4 h-0.5 ${
                      isWin || isPlaying
                        ? "bg-accent/40"
                        : isLoss
                        ? "bg-error/40"
                        : "bg-dim/20"
                    }`}
                  />
                )}
                <motion.div
                  animate={isPlaying ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className={`relative w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    isWin
                      ? "bg-success/20 border-success"
                      : isLoss
                      ? "bg-error/20 border-error"
                      : isPlaying
                      ? "bg-accent/20 border-accent"
                      : "bg-surface/30 border-dim/30"
                  }`}
                >
                  {isWin && <Check size={16} className="text-success" />}
                  {isLoss && <X size={16} className="text-error" />}
                  {isPlaying && <Play size={14} className="text-accent" />}
                  {isPending && <Clock size={14} className="text-dim" />}
                </motion.div>
              </div>
            );
          })}
          {/* Placeholder for un-created links */}
          {Array.from({ length: 6 - chain.links.length }).map((_, i) => (
            <div key={`placeholder-${i}`} className="flex items-center">
              <div className="w-4 h-0.5 bg-dim/10" />
              <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-dim/10 bg-surface/10">
                <Clock size={14} className="text-dim/30" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed link list */}
      <div className="space-y-2 max-w-sm mx-auto">
        {chain.links.map((link) => {
          const isYou = link.uid === currentUid;
          return (
            <motion.div
              key={link.linkIndex}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: link.linkIndex * 0.1 }}
              className={`flex items-center gap-3 py-2 px-3 rounded-lg ${
                link.result === "win"
                  ? "bg-success/10 border border-success/20"
                  : link.result === "loss"
                  ? "bg-error/10 border border-error/20"
                  : link.result === "playing"
                  ? "bg-accent/10 border border-accent/20"
                  : "bg-surface/20 border border-dim/10"
              }`}
            >
              <span className="text-lg">{GAME_EMOJIS[link.gameId] || ""}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {link.displayName || "Waiting..."}{isYou && " (You)"}
                </p>
                <p className="text-xs text-muted">{GAME_NAMES[link.gameId]}</p>
              </div>
              <div className="flex items-center gap-2">
                {link.result === "win" && (
                  <>
                    <span className="text-xs text-muted">{link.score} pts</span>
                    <Check size={16} className="text-success" />
                  </>
                )}
                {link.result === "loss" && <X size={16} className="text-error" />}
                {link.result === "playing" && (
                  <span className="text-xs text-accent animate-pulse">Playing...</span>
                )}
                {link.result === "pending" && (
                  <span className="text-xs text-dim">Waiting</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
