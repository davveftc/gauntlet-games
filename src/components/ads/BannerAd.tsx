"use client";
import { useEffect, useRef } from "react";

export default function BannerAd({ slot }: { slot: string }) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      // Ad blocked or not loaded
    }
  }, []);

  return (
    <div ref={adRef} className="w-full flex justify-center py-2 bg-surface/50">
      <ins
        className="adsbygoogle"
        style={{ display: "inline-block", width: 320, height: 50 }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
      />
    </div>
  );
}
