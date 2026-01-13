import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const videosPath = path.join(process.cwd(), 'data', 'videos.json');
    const analyticsPath = path.join(process.cwd(), 'data', 'analytics.json');

    const videosData = await fs.readFile(videosPath, 'utf-8');
    const videos = JSON.parse(videosData);
    const video = videos.find((v: any) => v.id === id);

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const analyticsData = await fs.readFile(analyticsPath, 'utf-8');
    const analytics = JSON.parse(analyticsData);
    const stats = analytics[id] || { views: 0, completions: 0 };

    return NextResponse.json({ ...video, ...stats });
  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}