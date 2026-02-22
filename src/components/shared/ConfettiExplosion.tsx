"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const COLORS = ["#6C2BD9", "#FF2D78", "#FFC300", "#00E676", "#8B5CF6"];

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
}

export default function ConfettiExplosion({ trigger }: { trigger: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 400,
        y: -(Math.random() * 400 + 100),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
      }));
      setParticles(newParticles);
      const timer = setTimeout(() => setParticles([]), 3000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] flex items-center justify-center overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{
            x: p.x,
            y: p.y + 600,
            opacity: 0,
            rotate: p.rotation,
          }}
          transition={{ duration: 2.5, ease: "easeOut" }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
}
