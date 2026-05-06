import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pullr — YouTube Downloader",
  description: "Download YouTube videos. No ads, no signup, no captcha.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
