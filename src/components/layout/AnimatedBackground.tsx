"use client";
import { motion } from "framer-motion";

const shapes = [
  { type: "circle", size: 60, x: "10%", y: "20%", delay: 0, duration: 10 },
  { type: "triangle", size: 40, x: "80%", y: "15%", delay: 2, duration: 12 },
  { type: "hexagon", size: 50, x: "60%", y: "70%", delay: 4, duration: 8 },
  { type: "circle", size: 30, x: "25%", y: "80%", delay: 1, duration: 14 },
  { type: "triangle", size: 70, x: "90%", y: "50%", delay: 3, duration: 11 },
  { type: "circle", size: 45, x: "50%", y: "30%", delay: 5, duration: 9 },
  { type: "hexagon", size: 35, x: "15%", y: "55%", delay: 2.5, duration: 13 },
];

function Shape({ type, size }: { type: string; size: number }) {
  if (type === "circle") {
    return (
      <div
        className="rounded-full border-2 border-primary/30"
        style={{ width: size, height: size }}
      />
    );
  }
  if (type === "triangle") {
    return (
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: `${size / 2}px solid transparent`,
          borderRight: `${size / 2}px solid transparent`,
          borderBottom: `${size}px solid rgba(108, 43, 217, 0.2)`,
        }}
      />
    );
  }
  return (
    <div
      className="bg-primary/15"
      style={{
        width: size,
        height: size,
        clipPath:
          "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
      }}
    />
  );
}

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {shapes.map((s, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: s.x, top: s.y }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 180, 360],
            opacity: [0.1, 0.25, 0.1],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Shape type={s.type} size={s.size} />
        </motion.div>
      ))}
    </div>
  );
}
