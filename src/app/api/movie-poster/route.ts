import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get("title");
  const year = req.nextUrl.searchParams.get("year");

  if (!title) {
    return NextResponse.json(
      { error: "Missing title" },
      { status: 400 }
    );
  }

  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    // No TMDB key configured — return null poster gracefully
    return NextResponse.json({ posterUrl: null });
  }

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      query: title,
      ...(year ? { year } : {}),
    });

    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?${params}`
    );
    const data = await res.json();

    if (data.results?.[0]?.poster_path) {
      return NextResponse.json({
        posterUrl: `https://image.tmdb.org/t/p/w500${data.results[0].poster_path}`,
      });
    }

    return NextResponse.json({ posterUrl: null });
  } catch {
    return NextResponse.json({ posterUrl: null });
  }
}
