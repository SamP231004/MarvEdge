import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

interface Video {
  id: string;
  title: string;
  file: string;
  views?: number;
  shareLink?: string;
  createdAt: string;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const filePath = path.join(process.cwd(), "data", "videos.json");
    const data = await fs.readFile(filePath, "utf-8");
    const videos: Video[] = JSON.parse(data);
    const video = videos.find((v: Video) => v.id === id);
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }
    return NextResponse.json(video);
  } 
  catch (error) {
    console.error("Error reading video data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}