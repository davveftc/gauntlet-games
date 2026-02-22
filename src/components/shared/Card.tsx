import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "gradient";
}

export default function Card({
  children,
  variant = "glass",
  className,
  ...props
}: CardProps) {
  if (variant === "gradient") {
    return (
      <div className={cn("gradient-border", className)} {...props}>
        <div className="p-5">{children}</div>
      </div>
    );
  }

  return (
    <div className={cn("glass-card p-5", className)} {...props}>
      {children}
    </div>
  );
}
