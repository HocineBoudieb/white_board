import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  
  if (!accessKey) {
    console.error('Unsplash API key is missing in server environment');
    return NextResponse.json({ error: 'Unsplash API key is not configured' }, { status: 500 });
  }

  console.log('Unsplash API Key loaded (first 5 chars):', accessKey.substring(0, 5));


  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const image = data.results[0];
      return NextResponse.json({
        url: image.urls.regular,
        alt: image.alt_description,
        credit: {
          name: image.user.name,
          link: image.user.links.html,
        },
      });
    }

    return NextResponse.json({ error: 'No images found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching from Unsplash:', error);
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
}
