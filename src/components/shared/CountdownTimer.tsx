"use client";
import { useCountdown } from "@/hooks/useCountdown";

export default function CountdownTimer() {
  const timeLeft = useCountdown();

  return (
    <div className="text-center">
      <p className="text-muted text-xs mb-1">Next puzzle in</p>
      <p className="font-display text-lg font-bold text-accent">{timeLeft}</p>
    </div>
  );
}
