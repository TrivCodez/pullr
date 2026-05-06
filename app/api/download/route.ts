import { NextRequest, NextResponse } from "next/server";
import { Innertube } from "youtubei.js";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get("id");
  const itag = req.nextUrl.searchParams.get("itag");
  const title = req.nextUrl.searchParams.get("title") ?? "video";
  const type = req.nextUrl.searchParams.get("type") ?? "video";

  if (!videoId || !itag) {
    return NextResponse.json({ error: "Missing id or itag" }, { status: 400 });
  }

  try {
    const yt = await Innertube.create({ retrieve_player: true });
    const info = await yt.getInfo(videoId);

    const allFormats = [
      ...(info.streaming_data?.formats ?? []),
      ...(info.streaming_data?.adaptive_formats ?? []),
    ];

    const format = allFormats.find((f) => f.itag === parseInt(itag));
    if (!format || !format.url) {
      return NextResponse.json({ error: "Format not found or no direct URL" }, { status: 404 });
    }

    const ext = type === "audio" ? "mp3" : "mp4";
    const safeTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();

    // Redirect to the direct stream URL - avoids Vercel timeout on large files
    return NextResponse.redirect(format.url, {
      headers: {
        "Content-Disposition": `attachment; filename="${safeTitle}.${ext}"`,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
