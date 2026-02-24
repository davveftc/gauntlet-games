import { NextRequest, NextResponse } from "next/server";
import { getAdminStats } from "@/lib/admin-db";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await checkAdminAuth(request);
  if (!auth.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stats = await getAdminStats();
  return NextResponse.json(stats);
}
