import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
const useKV = isVercel && (process.env.KV_URL || process.env.REDIS_URL);

async function getAnalytics() {
  if (useKV) {
    const analytics = await kv.get('analytics') as Record<string, { views: number; completions: number }>;
    return analytics || {};
  }
  else {
    const analyticsPath = path.join(process.cwd(), 'data', 'analytics.json');
    try {
      const fileContent = await fs.readFile(analyticsPath, 'utf-8');
      return JSON.parse(fileContent);
    }
    catch (error) {
      console.log('Could not read analytics.json, starting fresh');
      return {};
    }
  }
}

async function saveAnalytics(analytics: Record<string, { views: number; completions: number }>) {
  if (useKV) {
    await kv.set('analytics', analytics);
    console.log('Stored analytics in Vercel KV');
  } 
  else {
    const analyticsPath = path.join(process.cwd(), 'data', 'analytics.json');
    await fs.writeFile(analyticsPath, JSON.stringify(analytics, null, 2));
  }
}

export async function POST(request: NextRequest) {
  try {
    const { videoId, event } = await request.json();
    if (!videoId || !event) {
      return NextResponse.json({ error: 'Missing videoId or event' }, { status: 400 });
    }

    const analytics = await getAnalytics();
    if (!analytics[videoId]) {
      analytics[videoId] = { views: 0, completions: 0 };
    }

    if (event === 'view') {
      analytics[videoId].views += 1;
    }
    else if (event === 'completion') {
      analytics[videoId].completions += 1;
    }
    await saveAnalytics(analytics);
    return NextResponse.json({ success: true });
  }
  catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  if (!useKV) {
    return NextResponse.json({ error: 'KV not available' }, { status: 400 });
  }

  try {
    const analyticsPath = path.join(process.cwd(), 'data', 'analytics.json');
    const fileContent = await fs.readFile(analyticsPath, 'utf-8');
    const analytics = JSON.parse(fileContent);

    await kv.set('analytics', analytics);
    console.log('Migrated analytics to KV');

    return NextResponse.json({ success: true, migrated: analytics });
  } 
  catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}