import { cn } from "@/lib/utils";

interface GradientBorderProps {
  children: React.ReactNode;
  className?: string;
}

export default function GradientBorder({ children, className }: GradientBorderProps) {
  return (
    <div className={cn("gradient-border", className)}>
      {children}
    </div>
  );
}
