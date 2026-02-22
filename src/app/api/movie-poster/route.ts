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

  try {
    // Use iTunes Search API — free, no API key required
    const searchTerm = year ? `${title} ${year}` : title;
    const params = new URLSearchParams({
      term: searchTerm,
      media: "movie",
      entity: "movie",
      limit: "5",
    });

    const res = await fetch(
      `https://itunes.apple.com/search?${params}`
    );
    const data = await res.json();

    if (data.results?.length > 0) {
      // Find the best match by comparing titles
      const titleLower = title.toLowerCase();
      const match = data.results.find(
        (r: { trackName?: string }) =>
          r.trackName?.toLowerCase() === titleLower
      ) || data.results[0];

      if (match.artworkUrl100) {
        // Upscale artwork from 100x100 to 600x600
        const posterUrl = match.artworkUrl100.replace(
          "100x100bb",
          "600x600bb"
        );
        return NextResponse.json({ posterUrl });
      }
    }

    return NextResponse.json({ posterUrl: null });
  } catch {
    return NextResponse.json({ posterUrl: null });
  }
}
