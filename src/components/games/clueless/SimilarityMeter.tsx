"use client";
import { motion } from "framer-motion";

interface SimilarityMeterProps {
  similarity: number;
}

function getColor(similarity: number): string {
  if (similarity >= 90) return "from-success to-success";
  if (similarity >= 70) return "from-accent to-success";
  if (similarity >= 50) return "from-accent to-accent";
  if (similarity >= 30) return "from-secondary to-accent";
  return "from-primary to-secondary";
}

function getLabel(similarity: number): string {
  if (similarity >= 90) return "BURNING HOT";
  if (similarity >= 70) return "Hot";
  if (similarity >= 50) return "Warm";
  if (similarity >= 30) return "Cool";
  return "Cold";
}

export default function SimilarityMeter({ similarity }: SimilarityMeterProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted">{getLabel(similarity)}</span>
        <span className="text-accent font-bold">{similarity.toFixed(1)}%</span>
      </div>
      <div className="w-full h-3 bg-deep rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${getColor(similarity)}`}
          initial={{ width: 0 }}
          animate={{ width: `${similarity}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
