import { NextRequest, NextResponse } from 'next/server';
import { UTApi } from 'uploadthing/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';

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
    const videosPath = path.join(process.cwd(), 'data', 'videos.json');
    const fileContent = await fs.readFile(videosPath, 'utf-8');
    const videos = JSON.parse(fileContent);

    videos.push({
      id,
      file: videoUrl,
      title: `Recording ${id}`,
      views: 0,
      createdAt: new Date().toISOString(),
    });

    await fs.writeFile(videosPath, JSON.stringify(videos, null, 2));
    return NextResponse.json({ shareLink: `/share/${id}` });
  } 
  catch (error) {
    console.error('Trim upload error:', error);
    return NextResponse.json({ error: 'Trim upload failed' }, { status: 500 });
  }
}