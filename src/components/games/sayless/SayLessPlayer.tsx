"use client";
import { motion } from "framer-motion";
import { MessageSquareQuote } from "lucide-react";

interface SayLessPlayerProps {
  quote: string;
}

export default function SayLessPlayer({ quote }: SayLessPlayerProps) {
  return (
    <div className="glass-card p-4 mb-3">
      <div className="flex items-start gap-3">
        <MessageSquareQuote size={20} className="text-accent shrink-0 mt-0.5" />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white text-sm leading-relaxed italic"
        >
          &ldquo;{quote}&rdquo;
        </motion.p>
      </div>
    </div>
  );
}
