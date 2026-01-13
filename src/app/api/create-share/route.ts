import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: NextRequest) {
    try {
        const { videoUrl } = await req.json();

        const id = uuid();

        const videosPath = path.join(process.cwd(), "data", "videos.json");
        const fileContent = await fs.readFile(videosPath, "utf-8");
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
    catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to create share" }, { status: 500 });
    }
}
