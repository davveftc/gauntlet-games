"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { Volume2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Howl } from "howler";

interface SpellingBeeAudioProps {
  word: string;
  audioUrl?: string;
}

export default function SpellingBeeAudio({ word, audioUrl }: SpellingBeeAudioProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const howlRef = useRef<Howl | null>(null);
  const resolvedUrlRef = useRef<string | null>(null);

  // Clean up Howl instance and reset state when word changes
  useEffect(() => {
    resolvedUrlRef.current = null;
    setIsPlaying(false);
    setIsLoading(false);
    if (howlRef.current) {
      howlRef.current.unload();
      howlRef.current = null;
    }
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
    }
  }, [word]);

  // Ensure Web Speech voices are loaded
  useEffect(() => {
    if ("speechSynthesis" in window) {
      speechSynthesis.getVoices();
      speechSynthesis.addEventListener?.("voiceschanged", () => {
        speechSynthesis.getVoices();
      });
    }
  }, []);

  const playWithWebSpeech = useCallback(() => {
    if (!("speechSynthesis" in window)) return;

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.8;
    utterance.lang = "en-US";

    // Prefer an English voice if available
    const voices = speechSynthesis.getVoices();
    const enVoice = voices.find((v) => v.lang.startsWith("en"));
    if (enVoice) utterance.voice = enVoice;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };

    speechSynthesis.speak(utterance);
  }, [word]);

  const playWithHowl = useCallback((src: string) => {
    if (howlRef.current) {
      howlRef.current.unload();
    }
    const sound = new Howl({
      src: [src],
      html5: true,
      preload: true,
      onload: () => {
        sound.play();
      },
      onplay: () => {
        setIsPlaying(true);
        setIsLoading(false);
      },
      onend: () => setIsPlaying(false),
      onloaderror: () => {
        setIsLoading(false);
        playWithWebSpeech();
      },
      onplayerror: () => {
        setIsLoading(false);
        playWithWebSpeech();
      },
    });
    howlRef.current = sound;
  }, [playWithWebSpeech]);

  const fetchDictionaryAudio = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`
      );
      if (!res.ok) return null;
      const data = await res.json();
      for (const entry of data) {
        for (const phonetic of entry.phonetics ?? []) {
          if (phonetic.audio && phonetic.audio.length > 0) return phonetic.audio;
        }
      }
    } catch {
      // network error — fall through
    }
    return null;
  }, [word]);

  const handlePlay = async () => {
    if (isPlaying) return;
    setIsLoading(true);

    // If we already resolved an audio URL for this word, replay it
    if (resolvedUrlRef.current) {
      playWithHowl(resolvedUrlRef.current);
      return;
    }

    // Try explicit audioUrl prop first
    if (audioUrl) {
      resolvedUrlRef.current = audioUrl;
      playWithHowl(audioUrl);
      return;
    }

    // Fetch pronunciation from the free Dictionary API
    const dictUrl = await fetchDictionaryAudio();
    if (dictUrl) {
      resolvedUrlRef.current = dictUrl;
      playWithHowl(dictUrl);
      return;
    }

    // Last resort: Web Speech API
    playWithWebSpeech();
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handlePlay}
      disabled={isPlaying}
      className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center hover:bg-primary/30 transition-colors disabled:opacity-70 mx-auto"
    >
      {isLoading ? (
        <Loader2 size={32} className="text-primary-light animate-spin" />
      ) : (
        <Volume2 size={32} className={isPlaying ? "text-accent" : "text-primary-light"} />
      )}
    </motion.button>
  );
}
