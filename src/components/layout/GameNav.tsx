"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface GameNavProps {
  title?: string;
}

export default function GameNav({ title }: GameNavProps) {
  const router = useRouter();

  return (
    <div className="flex items-center mb-6">
      <button
        onClick={() => router.push("/")}
        className="flex items-center justify-center p-2 -ml-2 rounded-lg text-muted hover:text-white hover:bg-primary/20 transition-colors"
      >
        <ArrowLeft size={22} />
      </button>
      {title && (
        <h2 className="flex-1 font-display text-2xl font-bold text-center -ml-8">
          {title}
        </h2>
      )}
    </div>
  );
}
