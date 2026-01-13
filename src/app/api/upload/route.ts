import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('video') as File;
    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }

    const id = uuidv4();
    const filename = `${id}.webm`;
    const filepath = path.join(process.cwd(), 'public', 'uploads', filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filepath, buffer);

    // Update videos.json
    const videosPath = path.join(process.cwd(), 'data', 'videos.json');
    const videosData = await fs.readFile(videosPath, 'utf-8');
    const videos = JSON.parse(videosData);
    videos.push({
      id,
      title: `Recording ${id}`,
      file: `/uploads/${filename}`,
      shareLink: `/share/${id}`,
      createdAt: new Date().toISOString(),
    });
    await fs.writeFile(videosPath, JSON.stringify(videos, null, 2));

    return NextResponse.json({ shareLink: `/share/${id}` });
  } 
  catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}