import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { kv } from '@vercel/kv';

interface Video {
  id: string;
  title: string;
  file: string;
  views?: number;
  shareLink?: string;
  createdAt: string;
}

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
const useKV = isVercel && (process.env.KV_URL || process.env.REDIS_URL); 

async function getVideos(): Promise<Video[]> {
  if (useKV) {
    const videos = await kv.get('videos') as Video[];
    return videos || [];
  } 
  else {
    const videosPath = path.join(process.cwd(), "data", "videos.json");
    try {
      const data = await fs.readFile(videosPath, "utf-8");
      return JSON.parse(data);
    } 
    catch (error) {
      console.log('Could not read videos.json, returning empty array');
      return [];
    }
  }
}

async function getAnalytics(): Promise<Record<string, { views: number; completions: number }>> {
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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const videos = await getVideos();
    const video = videos.find((v: Video) => v.id === id);

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const analytics = await getAnalytics();
    const videoAnalytics = analytics[id] || { views: 0, completions: 0 };

    const videoWithAnalytics = {
      ...video,
      views: videoAnalytics.views,
      completions: videoAnalytics.completions,
    };

    return NextResponse.json(videoWithAnalytics);
  } 
  catch (error) {
    console.error("Error reading video data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}