export function canShowAd(lastShownTime: number, cooldownMs: number = 60000): boolean {
  return Date.now() - lastShownTime > cooldownMs;
}

export function loadAdScript(clientId: string): void {
  if (typeof window === "undefined") return;
  if (document.querySelector(`script[src*="adsbygoogle"]`)) return;

  const script = document.createElement("script");
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
  script.async = true;
  script.crossOrigin = "anonymous";
  document.head.appendChild(script);
}
