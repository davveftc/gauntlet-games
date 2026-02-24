import { NextRequest, NextResponse } from "next/server";
import { getGameAnalytics } from "@/lib/admin-db";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await checkAdminAuth(request);
  if (!auth.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date") || undefined;

  const analytics = await getGameAnalytics(date);
  return NextResponse.json(analytics);
}
