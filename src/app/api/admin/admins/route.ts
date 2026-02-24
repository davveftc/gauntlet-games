import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { checkAdminAuth } from "@/lib/admin-auth";

// GET /api/admin/admins — list all admin emails
export async function GET(request: NextRequest) {
  const auth = await checkAdminAuth(request);
  if (!auth.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("admin_emails")
    .select("email, added_at, added_by")
    .order("added_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ admins: data || [] });
}

// POST /api/admin/admins — add an admin email
export async function POST(request: NextRequest) {
  const auth = await checkAdminAuth(request);
  if (!auth.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const newEmail = body.email?.trim()?.toLowerCase();

  if (!newEmail || !newEmail.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { error } = await supabase.from("admin_emails").insert({
    email: newEmail,
    added_by: auth.email,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Email is already an admin" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/admins — remove an admin email
export async function DELETE(request: NextRequest) {
  const auth = await checkAdminAuth(request);
  if (!auth.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const emailToRemove = body.email?.trim()?.toLowerCase();

  if (!emailToRemove) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  // Prevent removing yourself
  if (emailToRemove === auth.email?.toLowerCase()) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  const { error } = await supabase
    .from("admin_emails")
    .delete()
    .eq("email", emailToRemove);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
