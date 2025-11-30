import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    console.error('YouTube API key is missing in server environment');
    // Fallback for demo purposes if no key is provided? 
    // No, better to fail explicitly so user knows to add key.
    return NextResponse.json({ error: 'YouTube API key is not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API error details:', errorData);
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const video = data.items[0];
      return NextResponse.json({
        videoId: video.id.videoId,
        title: video.snippet.title,
        thumbnail: video.snippet.thumbnails.default.url,
        channelTitle: video.snippet.channelTitle,
      });
    }

    return NextResponse.json({ error: 'No videos found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching from YouTube:', error);
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 });
  }
}
