"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "accent";
  size?: "sm" | "md" | "lg";
  glow?: boolean;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  glow = false,
  className,
  onClick,
  type = "button",
  disabled = false,
}: ButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={cn(
        "font-display font-bold rounded-2xl transition-all",
        {
          "bg-primary hover:bg-primary-light text-white": variant === "primary",
          "bg-secondary hover:brightness-110 text-white": variant === "secondary",
          "bg-accent hover:brightness-110 text-deep": variant === "accent",
          "bg-transparent border border-primary/40 hover:bg-primary/10 text-white":
            variant === "ghost",
        },
        {
          "px-4 py-2 text-sm": size === "sm",
          "px-6 py-3 text-base": size === "md",
          "px-8 py-4 text-lg": size === "lg",
        },
        glow && "animate-glow-pulse",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
}
