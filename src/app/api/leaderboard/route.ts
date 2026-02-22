import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "daily";
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  // For MVP, return empty array
  // In production, this would read from Firestore via getLeaderboard()
  return NextResponse.json([]);
}
