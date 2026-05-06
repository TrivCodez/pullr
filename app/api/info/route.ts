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
      (u.pathname.startsWith("/shorts/") ? u.pathname.split("/")[2] : null) ||
      (u.pathname.startsWith("/embed/") ? u.pathname.split("/")[2] : null);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!videoId) return NextResponse.json({ error: "Could not extract video ID" }, { status: 400 });

  try {
    const yt = await Innertube.create({ retrieve_player: true });
    const info = await yt.getInfo(videoId);
    const details = info.basic_info;

    const formats: {
      itag: number;
      quality: string;
      mimeType: string;
      hasAudio: boolean;
      hasVideo: boolean;
      contentLength?: string;
      bitrate?: number;
    }[] = [];

    const seen = new Set<number>();

    const addFormat = (f: {
      itag: number;
      quality_label?: string;
      mime_type?: string;
      has_audio?: boolean;
      has_video?: boolean;
      content_length?: bigint | number;
      average_bitrate?: number;
      url?: string;
    }, hasAudio: boolean, hasVideo: boolean) => {
      if (seen.has(f.itag) || !f.url) return;
      seen.add(f.itag);
      formats.push({
        itag: f.itag,
        quality: f.quality_label ?? (hasAudio && !hasVideo ? "audio" : "unknown"),
        mimeType: f.mime_type ?? "",
        hasAudio,
        hasVideo,
        contentLength: f.content_length?.toString(),
        bitrate: f.average_bitrate,
      });
    };

    for (const f of info.streaming_data?.formats ?? []) {
      addFormat(f, true, true);
    }
    for (const f of info.streaming_data?.adaptive_formats ?? []) {
      const mime = f.mime_type ?? "";
      addFormat(f, mime.startsWith("audio/"), mime.startsWith("video/"));
    }

    const thumb = details.thumbnail?.[0]?.url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    return NextResponse.json({
      id: videoId,
      title: details.title ?? "Unknown Title",
      author: details.author ?? "Unknown",
      duration: details.duration ?? 0,
      thumbnail: thumb,
      formats,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
