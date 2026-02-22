"use client";
import { useState } from "react";
import { Share2, Check } from "lucide-react";
import Button from "./Button";
import { copyToClipboard } from "@/lib/utils";

interface ShareButtonProps {
  text: string;
  label?: string;
}

export default function ShareButton({ text, label = "Share Result" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button variant="accent" size="md" onClick={handleShare}>
      {copied ? (
        <>
          <Check size={16} className="inline mr-2" />
          Copied!
        </>
      ) : (
        <>
          <Share2 size={16} className="inline mr-2" />
          {label}
        </>
      )}
    </Button>
  );
}
