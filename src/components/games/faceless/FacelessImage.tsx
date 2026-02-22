"use client";
import { motion } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Blur levels — indexed by number of wrong guesses                   */
/*  Stage 0 (start): heavily blurred, face unrecognisable              */
/*  Each wrong guess sharpens the image                                */
/* ------------------------------------------------------------------ */
const BLUR_LEVELS = [28, 19, 10];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
interface FacelessImageProps {
  imageUrl: string | null;
  loading: boolean;
  /** Number of wrong guesses (0-3), controls blur level */
  zoomLevel: number;
  /** Focal point (kept for API compat, unused in blur mode) */
  focalPoint: { x: number; y: number };
  /** Show full image — no blur */
  revealed: boolean;
}

export default function FacelessImage({
  imageUrl,
  loading,
  zoomLevel,
  revealed,
}: FacelessImageProps) {
  const blur = revealed
    ? 0
    : BLUR_LEVELS[Math.min(zoomLevel, BLUR_LEVELS.length - 1)];

  return (
    <motion.div
      className="w-full max-w-sm mx-auto aspect-square rounded-2xl overflow-hidden glass-card relative"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {loading ? (
        <div className="w-full h-full animate-pulse bg-dim/20" />
      ) : imageUrl ? (
        <motion.img
          src={imageUrl}
          alt="Mystery celebrity"
          className="w-full h-full object-cover"
          initial={{ filter: `blur(${blur}px)` }}
          animate={{ filter: `blur(${blur}px)` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ objectPosition: "center 15%" }}
          draggable={false}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-dim/30 bg-surface/20">
          ?
        </div>
      )}
    </motion.div>
  );
}
