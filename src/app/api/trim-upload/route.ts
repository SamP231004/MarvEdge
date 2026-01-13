import { NextRequest, NextResponse } from 'next/server';
import { UTApi } from 'uploadthing/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { kv } from '@vercel/kv';

// Check if we're in Vercel environment
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
const useKV = isVercel && process.env.KV_URL; // Only use KV if KV_URL is available

async function getVideos() {
  if (useKV) {
    // Use Vercel KV for persistent storage
    const videos = await kv.get('videos') as any[];
    return videos || [];
  } else {
    // Local development - read from file
    const videosPath = path.join(process.cwd(), 'data', 'videos.json');
    try {
      const fileContent = await fs.readFile(videosPath, 'utf-8');
      return JSON.parse(fileContent);
    } catch (error) {
      console.log('Could not read videos.json, starting fresh');
      return [];
    }
  }
}

async function saveVideos(videos: any[]) {
  if (useKV) {
    // Use Vercel KV for persistent storage
    await kv.set('videos', videos);
    console.log('Stored videos in Vercel KV');
  } else {
    // Local development - write to file
    const videosPath = path.join(process.cwd(), 'data', 'videos.json');
    await fs.writeFile(videosPath, JSON.stringify(videos, null, 2));
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('video') as File;

    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }

    // Upload to UploadThing
    const utapi = new UTApi();
    const uploadRes = await utapi.uploadFiles(file);

    if (!uploadRes.data) {
      console.error('UploadThing upload failed:', uploadRes);
      return NextResponse.json({ error: 'Upload to UploadThing failed' }, { status: 500 });
    }

    const videoUrl = uploadRes.data.ufsUrl;

    // Create share entry
    const id = uuid();
    const videos = await getVideos();

    videos.push({
      id,
      file: videoUrl,
      title: `Recording ${id}`,
      views: 0,
      createdAt: new Date().toISOString(),
    });

    await saveVideos(videos);

    return NextResponse.json({ shareLink: `/share/${id}` });
  } 
  catch (error) {
    console.error('Trim upload error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json({ error: 'Trim upload failed' }, { status: 500 });
  }
}