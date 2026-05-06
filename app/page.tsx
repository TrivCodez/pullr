"use client";

import { useState, useRef } from "react";

type Format = {
  itag: number;
  quality: string;
  mimeType: string;
  hasAudio: boolean;
  hasVideo: boolean;
  contentLength?: string;
};

type VideoInfo = {
  id: string;
  title: string;
  author: string;
  duration: number;
  thumbnail: string;
  formats: Format[];
};

function formatDuration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function formatBytes(bytes?: string) {
  if (!bytes) return null;
  const n = parseInt(bytes);
  if (n > 1e9) return `${(n / 1e9).toFixed(1)} GB`;
  if (n > 1e6) return `${(n / 1e6).toFixed(1)} MB`;
  return `${(n / 1e3).toFixed(0)} KB`;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [downloading, setDownloading] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFetch(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setInfo(null);
    try {
      const res = await fetch(`/api/info?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch");
      setInfo(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload(format: Format) {
    if (!info) return;
    setDownloading(format.itag);
    const type = format.hasVideo ? "video" : "audio";
    const dlUrl = `/api/download?id=${info.id}&itag=${format.itag}&title=${encodeURIComponent(info.title)}&type=${type}`;
    window.open(dlUrl, "_blank");
    setTimeout(() => setDownloading(null), 2000);
  }

  const videoFormats = info?.formats.filter((f) => f.hasVideo && f.hasAudio) ?? [];
  const audioFormats = info?.formats.filter((f) => f.hasAudio && !f.hasVideo) ?? [];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50" style={{backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,backgroundRepeat:"repeat",backgroundSize:"128px"}} />

      <header className="border-b border-white/5 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-[#ff3c3c] rounded-sm flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
          </div>
          <span className="font-mono text-sm tracking-widest uppercase text-white/80">Pullr</span>
        </div>
        <span className="font-mono text-xs text-white/20 tracking-wider">no ads · no signup · open source</span>
      </header>

      <div className="max-w-2xl mx-auto px-6 pt-20 pb-32">
        <div className="mb-14">
          <div className="font-mono text-xs text-[#ff3c3c] tracking-[0.3em] uppercase mb-4">YouTube Downloader</div>
          <h1 className="text-5xl font-black leading-[1.05] tracking-tight mb-5" style={{fontFamily:"'Georgia',serif"}}>
            Grab any video.<br />
            <span className="text-white/25">No nonsense.</span>
          </h1>
          <p className="text-white/40 text-sm leading-relaxed font-mono">Paste a YouTube URL. Pick your format. Done.</p>
        </div>

        <form onSubmit={handleFetch} className="mb-10">
          <div className="relative group">
            <div className="absolute -inset-px bg-gradient-to-r from-[#ff3c3c]/50 to-transparent rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center bg-white/[0.04] border border-white/10 rounded-lg overflow-hidden hover:border-white/20 focus-within:border-[#ff3c3c]/50 transition-colors duration-200">
              <svg className="ml-4 text-white/25 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21.582 6.186A2.502 2.502 0 0 0 19.96 4.56C18.49 4.16 12 4.16 12 4.16s-6.49 0-7.96.4A2.502 2.502 0 0 0 2.418 6.186C2.02 7.658 2.02 12 2.02 12s0 4.342.398 5.814A2.502 2.502 0 0 0 4.04 19.44C5.51 19.84 12 19.84 12 19.84s6.49 0 7.96-.4a2.502 2.502 0 0 0 1.622-1.626C21.98 16.342 21.98 12 21.98 12s-.018-4.342-.398-5.814zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>
              <input ref={inputRef} type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="flex-1 bg-transparent px-4 py-4 text-sm font-mono text-white placeholder:text-white/20 outline-none" />
              <button type="submit" disabled={loading || !url.trim()} className="m-2 px-5 py-2.5 bg-[#ff3c3c] hover:bg-[#ff5555] disabled:bg-white/10 disabled:text-white/20 text-white text-xs font-mono tracking-widest uppercase rounded transition-colors duration-150 flex-shrink-0">
                {loading ? <span className="flex items-center gap-2"><span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />Fetching</span> : "Fetch"}
              </button>
            </div>
          </div>
        </form>

        {error && <div className="mb-8 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg font-mono text-xs text-red-400">✗ {error}</div>}

        {info && (
          <div className="space-y-8">
            <div className="flex gap-5 items-start">
              <div className="relative flex-shrink-0 w-36 rounded-lg overflow-hidden bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={info.thumbnail} alt={info.title} className="w-full aspect-video object-cover" />
                <div className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-white/80">{formatDuration(info.duration)}</div>
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h2 className="font-bold text-base leading-snug mb-1.5 line-clamp-2" style={{fontFamily:"'Georgia',serif"}}>{info.title}</h2>
                <p className="text-white/40 text-xs font-mono">{info.author}</p>
              </div>
            </div>

            {videoFormats.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/30">Video + Audio</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {videoFormats.slice(0, 6).map((f) => (
                    <button key={f.itag} onClick={() => handleDownload(f)} disabled={downloading === f.itag} className="group flex items-center justify-between px-4 py-3 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.15] rounded-lg transition-all duration-150 text-left disabled:opacity-50">
                      <div>
                        <div className="text-sm font-bold font-mono text-white/90">{f.quality}</div>
                        <div className="text-[10px] font-mono text-white/25 mt-0.5">{f.mimeType.split(";")[0].split("/")[1]?.toUpperCase()}{formatBytes(f.contentLength) && ` · ${formatBytes(f.contentLength)}`}</div>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-white/5 group-hover:bg-[#ff3c3c]/20 flex items-center justify-center transition-colors duration-150">
                        {downloading === f.itag ? <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" /> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/50 group-hover:text-[#ff3c3c] transition-colors"><path d="M12 5v14M5 12l7 7 7-7"/></svg>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {audioFormats.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/30">Audio Only</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {audioFormats.slice(0, 4).map((f) => (
                    <button key={f.itag} onClick={() => handleDownload(f)} disabled={downloading === f.itag} className="group flex items-center justify-between px-4 py-3 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.15] rounded-lg transition-all duration-150 text-left disabled:opacity-50">
                      <div>
                        <div className="text-sm font-bold font-mono text-white/90">{f.quality === "audio" ? "Audio" : f.quality}</div>
                        <div className="text-[10px] font-mono text-white/25 mt-0.5">{f.mimeType.split(";")[0].split("/")[1]?.toUpperCase()}{formatBytes(f.contentLength) && ` · ${formatBytes(f.contentLength)}`}</div>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-white/5 group-hover:bg-[#ff3c3c]/20 flex items-center justify-center transition-colors duration-150">
                        {downloading === f.itag ? <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" /> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/50 group-hover:text-[#ff3c3c] transition-colors"><path d="M12 5v14M5 12l7 7 7-7"/></svg>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!info && !loading && !error && (
          <div className="mt-16 text-center">
            <div className="inline-flex flex-col items-center gap-4 text-white/15">
              <div className="w-16 h-16 border border-white/8 rounded-2xl flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
              </div>
              <p className="font-mono text-xs tracking-wider">Paste a link to get started</p>
            </div>
          </div>
        )}
      </div>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-white/5 bg-[#0a0a0a]/90 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
        <span className="font-mono text-[10px] text-white/15 tracking-wider">For personal use only. Respect copyright.</span>
        <span className="font-mono text-[10px] text-white/15 tracking-wider">Powered by youtubei.js</span>
      </footer>
    </main>
  );
}
