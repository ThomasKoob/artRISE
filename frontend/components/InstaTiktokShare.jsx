import { useState } from "react";

function IconInstagram(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      {...props}
    >
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5A5.5 5.5 0 1 1 6.5 13 5.5 5.5 0 0 1 12 7.5zm0 2A3.5 3.5 0 1 0 15.5 13 3.5 3.5 0 0 0 12 9.5zm5.25-3.25a1.25 1.25 0 1 1-1.25 1.25 1.25 1.25 0 0 1 1.25-1.25z" />
    </svg>
  );
}

function IconTikTok(props) {
  return (
    <svg
      viewBox="0 0 48 48"
      width="20"
      height="20"
      aria-hidden="true"
      {...props}
    >
      <path d="M30 6v7.1a10.9 10.9 0 0 0 8.9 4.5v5.8A16.7 16.7 0 0 1 30 20.5v9.1A10.4 10.4 0 1 1 19.6 19h.1v6a4.3 4.3 0 1 0 6.3 3.8V6z" />
    </svg>
  );
}

export default function InstaTiktokShare({
  url,
  title = "Check this auction on popAUC",
  text = "",
  className = "",
}) {
  const [msg, setMsg] = useState("");

  const shareText = text || title;
  const shareData = { title, text: shareText, url };

  async function nativeShareOrCopy(openUrl) {
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      // abgebrochen -> unten fallback
    }
    try {
      await navigator.clipboard.writeText(url);
      setMsg("Link kopiert – jetzt in der App einfügen");
      // App/Website optional öffnen, damit man sofort posten kann
      if (openUrl) window.open(openUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => setMsg(""), 1800);
    } catch {
      // letzter Fallback
      window.prompt("Copy this URL", url);
      if (openUrl) window.open(openUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Instagram */}
      <button
        onClick={() => nativeShareOrCopy("https://instagram.com")}
        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-gray-300 hover:bg-gray-50 transition text-sm"
        title="Auf Instagram teilen"
        aria-label="Auf Instagram teilen"
      >
        <IconInstagram className="fill-current" />
        <span>Instagram</span>
      </button>

      {/* TikTok */}
      <button
        onClick={() => nativeShareOrCopy("https://www.tiktok.com/upload")}
        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-gray-300 hover:bg-gray-50 transition text-sm"
        title="Auf TikTok teilen"
        aria-label="Auf TikTok teilen"
      >
        <IconTikTok className="fill-current" />
        <span>TikTok</span>
      </button>

      {/* Info-Toast mini */}
      {msg && <span className="text-xs text-gray-600 ml-2">{msg}</span>}
    </div>
  );
}
