import { NextRequest, NextResponse } from "next/server";
import { Innertube } from "youtubei.js";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "No URL provided" }, { status: 400 });

  let videoId: string | null = null;
  try {
    const u = new URL(url);
    videoId =
      u.searchParams.get("v") ||
      (u.hostname === "youtu.be" ? u.pathname.slice(1) : null) ||
      (u.pathname.startsWith("/shorts/") ? u.pathname.split("/")[2] : null);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!videoId) return NextResponse.json({ error: "Could not extract video ID" }, { status: 400 });

  try {
    const yt = await Innertube.create({ retrieve_player: false });
    const info = await yt.getBasicInfo(videoId);
    const details = info.basic_info;

    const formats: { itag: number; quality: string; mimeType: string; hasAudio: boolean; hasVideo: boolean; contentLength?: string }[] = [];

    if (info.streaming_data?.formats) {
      for (const f of info.streaming_data.formats) {
        formats.push({
          itag: f.itag,
          quality: f.quality_label ?? "unknown",
          mimeType: f.mime_type ?? "",
          hasAudio: true,
          hasVideo: true,
          contentLength: f.content_length?.toString(),
        });
      }
    }

    if (info.streaming_data?.adaptive_formats) {
      for (const f of info.streaming_data.adaptive_formats) {
        const hasVideo = (f.mime_type ?? "").startsWith("video/");
        const hasAudio = (f.mime_type ?? "").startsWith("audio/");
        formats.push({
          itag: f.itag,
          quality: f.quality_label ?? (hasAudio ? "audio" : "unknown"),
          mimeType: f.mime_type ?? "",
          hasAudio,
          hasVideo,
          contentLength: f.content_length?.toString(),
        });
      }
    }

    return NextResponse.json({
      id: videoId,
      title: details.title ?? "Unknown",
      author: details.author ?? "Unknown",
      duration: details.duration ?? 0,
      thumbnail: details.thumbnail?.[0]?.url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      formats,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
