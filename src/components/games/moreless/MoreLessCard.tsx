"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X as XIcon } from "lucide-react";
import type { MoreLessItem } from "@/types";

/* ------------------------------------------------------------------ */
/*  Wikipedia image fetching                                           */
/* ------------------------------------------------------------------ */
const imageCache = new Map<string, string | null>();
const pendingRequests = new Map<string, Promise<string | null>>();

const WIKI_OVERRIDES: Record<string, string> = {
  "LOTR: Return of the King": "The Lord of the Rings: The Return of the King",
  "Disney+": "Disney_Plus",
  "Se7en": "Seven_(1995_film)",
  "STAY - Kid LAROI & Bieber": "The Kid Laroi",
  "HUMBLE. - Kendrick Lamar": "Kendrick Lamar",
  "good 4 u - Olivia Rodrigo": "Olivia Rodrigo",
  "drivers license - Olivia Rodrigo": "Olivia Rodrigo",
  "Eternal Sunshine": "Eternal Sunshine of the Spotless Mind",
  "WALL-E": "WALL-E",
  "Samsung Galaxy": "Samsung Galaxy",
  "Apple Music": "Apple Music",
  "ChatGPT": "ChatGPT",
};

function getWikiQuery(name: string, category: string): string {
  if (WIKI_OVERRIDES[name]) return WIKI_OVERRIDES[name];
  if (category === "Spotify Streams") {
    const parts = name.split(" - ");
    return parts.length > 1 ? parts[1].trim() : name;
  }
  if (category === "Movie Ratings") {
    return `${name} (film)`;
  }
  return name;
}

function useWikiImage(name: string, category: string) {
  const query = getWikiQuery(name, category);
  const [url, setUrl] = useState<string | null>(imageCache.get(query) ?? null);
  const [loading, setLoading] = useState(!imageCache.has(query));

  useEffect(() => {
    if (imageCache.has(query)) {
      setUrl(imageCache.get(query)!);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchImage() {
      if (!pendingRequests.has(query)) {
        const promise = fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
        )
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            const thumbUrl: string | null = data?.thumbnail?.source ?? null;
            imageCache.set(query, thumbUrl);
            pendingRequests.delete(query);
            return thumbUrl;
          })
          .catch(() => {
            imageCache.set(query, null);
            pendingRequests.delete(query);
            return null;
          });
        pendingRequests.set(query, promise);
      }

      const result = await pendingRequests.get(query)!;
      if (!cancelled) {
        setUrl(result);
        setLoading(false);
      }
    }

    fetchImage();
    return () => {
      cancelled = true;
    };
  }, [query]);

  return { url, loading };
}

/* ------------------------------------------------------------------ */
/*  Formatting                                                         */
/* ------------------------------------------------------------------ */
function formatValue(value: number): string {
  if (value >= 1_000_000_000) {
    const n = value / 1_000_000_000;
    return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    const n = value / 1_000_000;
    return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)}M`;
  }
  if (value >= 1_000) {
    const n = value / 1_000;
    return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)}K`;
  }
  return value.toLocaleString();
}

/* ------------------------------------------------------------------ */
/*  Counter animation hook                                             */
/* ------------------------------------------------------------------ */
const COUNTER_DURATION = 800; // ms
const COUNTER_STEPS = 12;

function useCounterAnimation(value: number, shouldAnimate: boolean) {
  const [displayValue, setDisplayValue] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const prevShouldAnimate = useRef(false);

  useEffect(() => {
    // Only trigger when showValue transitions from false → true
    if (shouldAnimate && !prevShouldAnimate.current) {
      setDone(false);
      const finalFormatted = formatValue(value);

      // Determine magnitude for random number generation
      const magnitude = value >= 1_000_000_000
        ? 1_000_000_000
        : value >= 1_000_000
        ? 1_000_000
        : value >= 1_000
        ? 1_000
        : 1;

      let step = 0;
      const interval = setInterval(() => {
        step++;
        if (step >= COUNTER_STEPS) {
          clearInterval(interval);
          setDisplayValue(finalFormatted);
          setDone(true);
          return;
        }
        // Generate random value in same magnitude range
        const randomVal =
          Math.floor(Math.random() * 9 * magnitude) + magnitude;
        setDisplayValue(formatValue(randomVal));
      }, COUNTER_DURATION / COUNTER_STEPS);

      return () => clearInterval(interval);
    } else if (!shouldAnimate) {
      setDisplayValue(null);
      setDone(false);
    }
    prevShouldAnimate.current = shouldAnimate;
  }, [shouldAnimate, value]);

  // If already showing (champion card), skip animation
  if (shouldAnimate && prevShouldAnimate.current && displayValue === null) {
    return { displayValue: formatValue(value), animating: false };
  }

  return {
    displayValue: displayValue ?? formatValue(value),
    animating: shouldAnimate && !done,
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
interface MoreLessCardProps {
  item: MoreLessItem;
  showValue: boolean;
  onClick?: () => void;
  disabled?: boolean;
  /** "correct" = this card has the HIGHER value, "wrong" = lower */
  result?: "correct" | "wrong" | null;
  /** true when the user selected THIS card */
  isSelected?: boolean;
}

export default function MoreLessCard({
  item,
  showValue,
  onClick,
  disabled,
  result,
  isSelected,
}: MoreLessCardProps) {
  const { url: imageUrl, loading: imageLoading } = useWikiImage(
    item.name,
    item.category
  );

  const { displayValue, animating } = useCounterAnimation(
    item.value,
    showValue
  );

  const borderStyle =
    result === "correct"
      ? "border-success/60 shadow-[0_0_16px_rgba(34,197,94,0.2)]"
      : result === "wrong"
      ? "border-error/40 opacity-60"
      : "";

  const clickable = onClick && !disabled;

  return (
    <motion.div
      layout
      className={`glass-card overflow-hidden flex-1 text-center transition-all relative ${
        clickable
          ? "cursor-pointer hover:border-accent/40 hover:scale-[1.02] active:scale-[0.97]"
          : ""
      } ${borderStyle}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      onClick={clickable ? onClick : undefined}
    >
      {/* ---- Image (half-height) ---- */}
      <div className="w-full aspect-video bg-surface/40 overflow-hidden">
        {imageLoading ? (
          <div className="w-full h-full animate-pulse bg-dim/20" />
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={item.name}
            className="w-full h-full object-contain bg-black/20"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-dim/30 bg-surface/20">
            {item.name[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* ---- Content area ---- */}
      <div className="p-2.5">
        <h3 className="font-display text-2xl font-bold leading-tight mb-1 line-clamp-2">
          {item.name}
        </h3>

        <AnimatePresence mode="wait">
          {showValue ? (
            <motion.div
              key="value"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <p
                className={`font-display text-lg font-bold tabular-nums ${
                  animating
                    ? "text-accent"
                    : result === "correct"
                    ? "text-success"
                    : "text-muted"
                }`}
              >
                {displayValue}
              </p>
              <p className="text-muted text-[9px]">{item.unit}</p>
            </motion.div>
          ) : (
            <motion.div
              key="hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <p className="font-display text-lg font-bold text-primary-light">
                ?
              </p>
              <p className="text-muted text-[9px]">&nbsp;</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ---- Selected badge ---- */}
      {isSelected && result && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${
            result === "correct" ? "bg-success" : "bg-error"
          }`}
        >
          {result === "correct" ? (
            <Check size={14} className="text-white" />
          ) : (
            <XIcon size={14} className="text-white" />
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
