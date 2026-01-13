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

// Check if we're in Vercel environment
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
const useKV = isVercel && process.env.KV_URL; // Only use KV if KV_URL is available

async function getVideos(): Promise<Video[]> {
  if (useKV) {
    // Use Vercel KV for persistent storage
    const videos = await kv.get('videos') as Video[];
    return videos || [];
  } else {
    // Local development - read from file
    const videosPath = path.join(process.cwd(), "data", "videos.json");
    try {
      const data = await fs.readFile(videosPath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.log('Could not read videos.json, returning empty array');
      return [];
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

    return NextResponse.json(video);
  } catch (error) {
    console.error("Error reading video data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}