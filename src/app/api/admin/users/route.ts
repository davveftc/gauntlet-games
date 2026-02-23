import { NextRequest, NextResponse } from "next/server";
import { getAdminUsers } from "@/lib/admin-db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || undefined;
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const result = await getAdminUsers(search, limit, offset);
  return NextResponse.json(result);
}
