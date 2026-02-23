import { NextResponse } from "next/server";
import { getAdminStats } from "@/lib/admin-db";

export async function GET() {
  const stats = await getAdminStats();
  return NextResponse.json(stats);
}
