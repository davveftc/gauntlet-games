import { NextResponse } from "next/server";

export async function GET() {
  // For MVP, return static daily content
  // In production, this would read from Firestore via getDailyContent()
  const today = new Date().toISOString().split("T")[0];

  return NextResponse.json({
    date: today,
    wordless: { word: "CRANE" },
    songless: { songId: "1" },
    moreless: { pairCount: 10 },
    clueless: { targetWord: "OCEAN" },
    spellingbee: { wordCount: 5 },
  });
}
