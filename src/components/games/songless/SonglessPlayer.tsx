"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Howl } from "howler";

interface SonglessPlayerProps {
  previewUrl: string | null;
  isLoading: boolean;
  error: string | null;
  guessNumber: number;
  maxDuration: number;
}

const DURATIONS = [0.1, 0.3, 0.5, 1, 2, 5];

export default function SonglessPlayer({
  previewUrl,
  isLoading,
  error,
  guessNumber,
  maxDuration,
}: SonglessPlayerProps) {
  const howlRef = useRef<Howl | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const currentDuration = DURATIONS[Math.min(guessNumber, DURATIONS.length - 1)];
  const progressPercent = (currentDuration / maxDuration) * 100;

  // Load audio when previewUrl changes
  useEffect(() => {
    setAudioReady(false);
    setAudioError(null);

    if (howlRef.current) {
      howlRef.current.unload();
      howlRef.current = null;
    }

    if (!previewUrl) return;

    const sound = new Howl({
      src: [previewUrl],
      html5: true,
      preload: true,
      onload: () => setAudioReady(true),
      onloaderror: () => setAudioError("Could not load audio preview"),
      onplayerror: () => setAudioError("Could not play audio preview"),
    });

    howlRef.current = sound;

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      sound.unload();
    };
  }, [previewUrl]);

  // Reset playback state when guess number changes
  useEffect(() => {
    if (howlRef.current) {
      howlRef.current.pause();
      howlRef.current.seek(0);
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsPlaying(false);
  }, [guessNumber]);

  const handlePlay = useCallback(() => {
    if (!howlRef.current || !audioReady) return;

    howlRef.current.seek(0);
    howlRef.current.play();
    setIsPlaying(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (howlRef.current) {
        howlRef.current.pause();
        howlRef.current.seek(0);
      }
      setIsPlaying(false);
    }, currentDuration * 1000);
  }, [audioReady, currentDuration]);

  const displayError = error || audioError;
  const showLoading = isLoading || (!audioReady && !displayError && !!previewUrl);

  return (
    <div className="flex items-center gap-3 glass-card p-3 mb-3">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handlePlay}
        disabled={showLoading || !!displayError || !audioReady}
        className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
      >
        {showLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : displayError ? (
          <AlertCircle size={18} />
        ) : isPlaying ? (
          <Pause size={18} />
        ) : (
          <Play size={18} className="ml-0.5" />
        )}
      </motion.button>

      <div className="flex-1 min-w-0">
        <div className="w-full h-1.5 bg-deep rounded-full overflow-hidden mb-1">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: isPlaying ? `${progressPercent}%` : 0 }}
            transition={{ duration: currentDuration, ease: "linear" }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted">
          {displayError ? (
            <span className="text-error truncate">{displayError}</span>
          ) : showLoading ? (
            <span>Loading...</span>
          ) : (
            <>
              <span>{currentDuration}s unlocked</span>
              <span>{maxDuration}s total</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
