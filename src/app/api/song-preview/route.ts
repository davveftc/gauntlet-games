import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get("title");
  const artist = req.nextUrl.searchParams.get("artist");

  if (!title || !artist) {
    return NextResponse.json(
      { error: "Missing title or artist" },
      { status: 400 }
    );
  }

  try {
    // Try specific search first
    const query = `artist:"${artist}" track:"${title}"`;
    const res = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=3`
    );
    const data = await res.json();

    if (data.data?.[0]?.preview) {
      const track = data.data[0];
      return NextResponse.json({
        previewUrl: track.preview,
        coverUrl: track.album?.cover_big || track.album?.cover_medium || null,
      });
    }

    // Fallback: broader search
    const fallbackRes = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(`${title} ${artist}`)}&limit=3`
    );
    const fallbackData = await fallbackRes.json();

    if (fallbackData.data?.[0]?.preview) {
      const track = fallbackData.data[0];
      return NextResponse.json({
        previewUrl: track.preview,
        coverUrl: track.album?.cover_big || track.album?.cover_medium || null,
      });
    }

    return NextResponse.json(
      { error: "No preview found" },
      { status: 404 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch preview" },
      { status: 500 }
    );
  }
}
