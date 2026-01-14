import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { promises as fs } from "fs";
import path from "path";
import { kv } from '@vercel/kv';

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
const useKV = isVercel && process.env.KV_URL;

async function getVideos() {
    if (useKV) {
        const videos = await kv.get('videos') as any[];
        return videos || [];
    } 
    else {
        const videosPath = path.join(process.cwd(), 'data', 'videos.json');
        try {
            const fileContent = await fs.readFile(videosPath, 'utf-8');
            return JSON.parse(fileContent);
        } 
        catch (error) {
            console.log('Could not read videos.json, starting fresh');
            return [];
        }
    }
}

async function saveVideos(videos: any[]) {
    if (useKV) {
        await kv.set('videos', videos);
        console.log('Stored videos in Vercel KV');
    } 
    else {
        const videosPath = path.join(process.cwd(), 'data', 'videos.json');
        await fs.writeFile(videosPath, JSON.stringify(videos, null, 2));
    }
}

export async function POST(req: NextRequest) {
    try {
        const { videoUrl } = await req.json();

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
    catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to create share" }, { status: 500 });
    }
}