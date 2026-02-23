import { NextRequest, NextResponse } from "next/server";
import { getAdminUsers } from "@/lib/admin-db";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await checkAdminAuth(request);
  if (!auth.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || undefined;
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const result = await getAdminUsers(search, limit, offset);
  return NextResponse.json(result);
}
