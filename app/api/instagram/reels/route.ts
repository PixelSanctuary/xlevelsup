import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface InstagramReel {
  id: string;
  caption: string;
  mediaUrl: string;
  thumbnailUrl: string;
  permalink: string;
  timestamp: string;
  /**
   * Whether Instagram returned a media_url for this reel.
   *
   * Meta omits media_url for most reels (currently 15 of 18) — it returns
   * HTTP 200 and simply leaves the key out, with no error or reason. Reels
   * without it cannot be played inline; they render as a thumbnail that opens
   * the permalink instead. Previously these were filtered out entirely, which
   * is why only 3 of 18 reels reached the page.
   */
  playable: boolean;
}

interface IGMediaItem {
  id: string;
  caption?: string;
  media_type: string;
  media_product_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
}

const REELS_COUNT = 5;

export async function GET() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Instagram access token is not configured' },
      { status: 503 },
    );
  }

  try {
    const fields =
      'id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp';
    const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=25&access_token=${accessToken}`;

    // Cached for 5 minutes — newly uploaded reels appear automatically
    const res = await fetch(url, { next: { revalidate: 300 } });

    if (!res.ok) {
      const body = await res.text();
      console.error('Instagram API error:', res.status, body);
      return NextResponse.json(
        { error: 'Failed to fetch Instagram media' },
        { status: 502 },
      );
    }

    const json: { data?: IGMediaItem[] } = await res.json();

    // Keep every reel that has SOMETHING to show. A reel needs either a
    // media_url (playable inline) or a thumbnail_url (renders as a poster that
    // opens the permalink). Requiring media_url here was dropping 15 of 18.
    const allReels: InstagramReel[] = (json.data ?? [])
      .filter(
        (m) =>
          m.media_type === 'VIDEO' &&
          (m.media_product_type ? m.media_product_type === 'REELS' : true) &&
          (m.media_url || m.thumbnail_url),
      )
      .map((m) => ({
        id: m.id,
        caption: m.caption ?? '',
        mediaUrl: m.media_url ?? '',
        thumbnailUrl: m.thumbnail_url ?? '',
        permalink: m.permalink,
        timestamp: m.timestamp,
        playable: Boolean(m.media_url),
      }));

    // The centre stage plays video, so a playable reel must occupy slot 0.
    // Newest-first order is otherwise preserved: we only promote the most
    // recent playable reel to the front, leaving everything else in sequence.
    const firstPlayable = allReels.findIndex((r) => r.playable);
    if (firstPlayable > 0) {
      const [promoted] = allReels.splice(firstPlayable, 1);
      allReels.unshift(promoted);
    }

    const reels = allReels.slice(0, REELS_COUNT);

    return NextResponse.json(
      { reels },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      },
    );
  } catch (error) {
    console.error('Instagram reels fetch failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Instagram reels' },
      { status: 500 },
    );
  }
}
