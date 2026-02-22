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
    // Use Wikipedia API — free, no API key required
    // Search for the movie's Wikipedia page, then grab its main image
    const searchTitle = year ? `${title} (${year} film)` : `${title} (film)`;

    // Step 1: Search for the Wikipedia page
    const searchParams = new URLSearchParams({
      action: "query",
      format: "json",
      titles: searchTitle,
      prop: "pageimages",
      pithumbsize: "500",
      redirects: "1",
    });

    let res = await fetch(
      `https://en.wikipedia.org/w/api.php?${searchParams}`
    );
    let data = await res.json();
    let pages = data.query?.pages;
    let page = pages ? Object.values(pages)[0] as { thumbnail?: { source: string }; missing?: boolean } : null;

    // If "(year film)" didn't match, try just "(film)"
    if ((!page || page.missing) && year) {
      const fallbackParams = new URLSearchParams({
        action: "query",
        format: "json",
        titles: `${title} (film)`,
        prop: "pageimages",
        pithumbsize: "500",
        redirects: "1",
      });

      res = await fetch(
        `https://en.wikipedia.org/w/api.php?${fallbackParams}`
      );
      data = await res.json();
      pages = data.query?.pages;
      page = pages ? Object.values(pages)[0] as { thumbnail?: { source: string }; missing?: boolean } : null;
    }

    // If "(film)" didn't match either, try the bare title
    if (!page || page.missing) {
      const bareParams = new URLSearchParams({
        action: "query",
        format: "json",
        titles: title,
        prop: "pageimages",
        pithumbsize: "500",
        redirects: "1",
      });

      res = await fetch(
        `https://en.wikipedia.org/w/api.php?${bareParams}`
      );
      data = await res.json();
      pages = data.query?.pages;
      page = pages ? Object.values(pages)[0] as { thumbnail?: { source: string }; missing?: boolean } : null;
    }

    if (page?.thumbnail?.source) {
      return NextResponse.json({ posterUrl: page.thumbnail.source });
    }

    return NextResponse.json({ posterUrl: null });
  } catch {
    return NextResponse.json({ posterUrl: null });
  }
}
