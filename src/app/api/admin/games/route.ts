import { NextRequest, NextResponse } from "next/server";
import { getGameAnalytics } from "@/lib/admin-db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date") || undefined;

  const analytics = await getGameAnalytics(date);
  return NextResponse.json(analytics);
}
