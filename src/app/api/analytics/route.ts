import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { videoId, event } = await request.json();
    if (!videoId || !event) {
      return NextResponse.json({ error: 'Missing videoId or event' }, { status: 400 });
    }

    const analyticsPath = path.join(process.cwd(), 'data', 'analytics.json');
    const analyticsData = await fs.readFile(analyticsPath, 'utf-8');
    const analytics = JSON.parse(analyticsData);

    if (!analytics[videoId]) {
      analytics[videoId] = { views: 0, completions: 0 };
    }

    if (event === 'view') {
      analytics[videoId].views += 1;
    } 
    else if (event === 'completion') {
      analytics[videoId].completions += 1;
    }

    await fs.writeFile(analyticsPath, JSON.stringify(analytics, null, 2));

    return NextResponse.json({ success: true });
  } 
  catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}