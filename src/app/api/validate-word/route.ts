import { NextRequest, NextResponse } from "next/server";
import dictionary from "@/data/english-dictionary.json";

const wordSet = new Set(dictionary as string[]);

export async function POST(request: NextRequest) {
  const { word } = await request.json();

  if (!word || typeof word !== "string") {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const valid = wordSet.has(word.toLowerCase().trim());
  return NextResponse.json({ valid });
}
