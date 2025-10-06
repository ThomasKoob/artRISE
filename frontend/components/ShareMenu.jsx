import { useState, useMemo } from "react";

const enc = encodeURIComponent;
const nl = "\n";

function buildShareMessage({ artistName, artworkTitle, shareUrl }) {
  const line1 = artistName
    ? `${artistName} is running a pop-up auction on popAUC`
    : `Pop-up auction on popAUC`;
  const line2 = artworkTitle ? `“${artworkTitle}”` : "";
  return [line1, line2, shareUrl].filter(Boolean).join(nl);
}

export default function ShareMenu({
  url,
  artistName = "",
  artworkTitle = "",
  imageUrl = "", // <— Profilbild ODER Artwork: öffentlich erreichbar (CORS!)
  utm = "utm_source=share&utm_medium=button&utm_campaign=auction",
  className = "",
  buttonLabel = "Share",
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    if (!url) return "";
    return url.includes("?") ? `${url}&${utm}` : `${url}?${utm}`;
  }, [url, utm]);

  const message = useMemo(
    () => buildShareMessage({ artistName, artworkTitle, shareUrl }),
    [artistName, artworkTitle, shareUrl]
  );

  async function onNativeShare() {
    // 1) Versuche Bild + Text + Link (nur wo unterstützt)
    if (imageUrl) {
      try {
        const res = await fetch(imageUrl, { credentials: "omit" });
        // Hinweis: Das Bild muss CORS-fähig/öffentlich sein.
        const blob = await res.blob();
        const filename = imageUrl.split("/").pop() || "image.jpg";
        const type = blob.type || "image/jpeg";
        const file = new File([blob], filename, { type });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: artworkTitle || artistName || "popAUC",
            text: message,
            url: shareUrl, // viele OS zeigen dann Bild + Text + Link
            files: [file],
          });
          return;
        }
      } catch {
        // Wenn Bild-Download / CORS scheitert, weiter zu Text-Share
      }
    }

    // 2) Fallback: nur Text + Link
    try {
      if (navigator.share) {
        await navigator.share({
          title: artworkTitle || artistName || "popAUC",
          text: message,
          url: shareUrl,
        });
      } else {
        await copyMessage();
      }
    } catch {
      /* ignore */
    }
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this message", message);
    }
  }

  const links = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/?text=${enc(message)}`,
    },
    {
      key: "telegram",
      label: "Telegram",
      href: `https://t.me/share/url?url=${enc(shareUrl)}&text=${enc(message)}`,
    },
    {
      key: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}`,
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(
        shareUrl
      )}`,
    },
    {
      key: "email",
      label: "E-mail",
      href: `mailto:?subject=${enc(
        artistName
          ? `${artistName} — popAUC auction${
              artworkTitle ? `: “${artworkTitle}”` : ""
            }`
          : `popAUC auction${artworkTitle ? `: “${artworkTitle}”` : ""}`
      )}&body=${enc(message)}`,
    },
  ];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        onClick={onNativeShare}
        className="rounded-xl px-3 py-2 border border-buttonPink bg-greenButton/40 hover:bg-lightRedButton/40 transition text-sm"
        aria-label="Share"
        title="Share"
        type="button"
      >
        {buttonLabel}
      </button>

      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-xl px-3 py-2 border border-buttonPink bg-greenButton/40 hover:bg-lightRedButton/40 transition text-sm"
          aria-haspopup="menu"
          aria-expanded={open}
          title="More options"
          type="button"
        >
          …
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-56 rounded-2xl border-1 bg-darkBackground/60 text-buttonPink shadow-lg p-1 z-50"
            onMouseLeave={() => setOpen(false)}
          >
            {links.map((l) => (
              <a
                key={l.key}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                className="block px-3 py-2 rounded-xl hover:bg-gray-100/20 text-sm"
              >
                {l.label}
              </a>
            ))}
            <button
              onClick={copyMessage}
              role="menuitem"
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100/20 text-sm"
              type="button"
            >
              {copied ? "Message copied ✓" : "Copy message"}
            </button>
            <div className="px-3 pb-2 pt-1 text-xs opacity-60">
              Native share tries to include the image; links use text + preview.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
