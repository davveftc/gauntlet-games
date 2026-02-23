import { createServerClient } from "@supabase/ssr";
import { NextRequest } from "next/server";

/**
 * Create a Supabase client for server-side use in middleware/API routes.
 * Reads auth session from request cookies.
 */
function createSupabaseFromRequest(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "demo-anon-key",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // Middleware doesn't need to set cookies for auth checks
        },
      },
    }
  );
}

export interface AdminAuthResult {
  isAuthenticated: boolean;
  isAdmin: boolean;
  email: string | null;
  uid: string | null;
}

/**
 * Check if the current request is from an authenticated admin user.
 * Used by middleware and API routes.
 */
export async function checkAdminAuth(request: NextRequest): Promise<AdminAuthResult> {
  const supabase = createSupabaseFromRequest(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { isAuthenticated: false, isAdmin: false, email: null, uid: null };
  }

  // Check if the user's email is in the admin_emails table
  const { data: adminRow } = await supabase
    .from("admin_emails")
    .select("email")
    .eq("email", user.email.toLowerCase())
    .single();

  return {
    isAuthenticated: true,
    isAdmin: !!adminRow,
    email: user.email,
    uid: user.id,
  };
}
