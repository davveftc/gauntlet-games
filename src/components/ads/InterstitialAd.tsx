"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAdStore } from "@/stores/adStore";

interface InterstitialAdProps {
  show: boolean;
  onClose: () => void;
  slot: string;
}

export default function InterstitialAd({ show, onClose, slot }: InterstitialAdProps) {
  const [canClose, setCanClose] = useState(false);
  const { recordInterstitial } = useAdStore();

  useEffect(() => {
    if (show) {
      recordInterstitial();
      const timer = setTimeout(() => setCanClose(true), 5000);
      return () => clearTimeout(timer);
    }
    setCanClose(false);
  }, [show, recordInterstitial]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-deep/95 flex items-center justify-center"
        >
          {canClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted hover:text-white p-2"
            >
              <X size={28} />
            </button>
          )}
          <div className="w-full max-w-sm mx-auto">
            <ins
              className="adsbygoogle"
              style={{ display: "block", width: "100%", height: 300 }}
              data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
              data-ad-slot={slot}
              data-ad-format="auto"
            />
            {!canClose && (
              <p className="text-muted text-sm text-center mt-4">
                Ad closes in 5 seconds...
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
