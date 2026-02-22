import { cn } from "@/lib/utils";

interface GlowTextProps {
  children: React.ReactNode;
  color?: "purple" | "pink" | "gold";
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

export default function GlowText({
  children,
  color = "purple",
  className,
  as: Tag = "span",
}: GlowTextProps) {
  const glowClass = {
    purple: "neon-text",
    pink: "neon-text-pink",
    gold: "neon-text-gold",
  }[color];

  return (
    <Tag className={cn("font-display font-bold", glowClass, className)}>
      {children}
    </Tag>
  );
}
