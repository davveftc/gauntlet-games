"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface GameNavProps {
  title?: string;
}

export default function GameNav({ title }: GameNavProps) {
  const router = useRouter();

  return (
    <div className="relative flex items-center mb-6">
      <button
        onClick={() => router.push("/")}
        className="relative z-10 flex items-center justify-center p-2 -ml-2 rounded-lg text-muted hover:text-white hover:bg-primary/20 transition-colors"
      >
        <ArrowLeft size={22} />
      </button>
      {title && (
        <h2 className="absolute inset-0 flex items-center justify-center font-display text-7xl lg:text-8xl font-bold pointer-events-none">
          {title}
        </h2>
      )}
    </div>
  );
}
