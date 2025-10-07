import { useState, useMemo } from "react";

/** Helpers */
const enc = encodeURIComponent;
const NL = "\n";

/** Einheitliche Message für alle Kanäle */
function buildShareMessage({ artistName, artworkTitle, shareUrl }) {
  const line1 = artistName ? `${artistName} on popAUC` : `popAUC`;
  const line2 = artworkTitle ? `"${artworkTitle}"` : ""; // ASCII-Quotes
  return [line1, line2, shareUrl].filter(Boolean).join(NL);
}

/** Instagram-Kurz-Caption (ohne Link) */
function buildCaption({ artistName, artworkTitle }) {
  const titleLine = artworkTitle ? `"${artworkTitle}"` : "";
  const artistLine = artistName ? `${artistName} on popAUC` : `popAUC`;
  return [titleLine, artistLine].filter(Boolean).join("\n");
}

/** Problematische Zeichen fürs Subject entschärfen (nur ASCII lassen) */
function sanitizeSubject(s) {
  return String(s || "")
    .replace(/[“”„”]/g, '"')
    .replace(/[’‘]/g, "'")
    .replace(/[—–]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/** Mailto-Builder mit encodeURIComponent (verhindert '+' statt Space) */
function buildMailtoHref({ subject, body }) {
  const qs = [
    subject ? `subject=${encodeURIComponent(subject)}` : null,
    body ? `body=${encodeURIComponent(body)}` : null,
  ]
    .filter(Boolean)
    .join("&");
  return `mailto:?${qs}`;
}

export default function ShareMenu({
  url, // kanonische Auktions-URL (ohne UTM)
  artistName = "", // <- kommt aus auction.title
  artworkTitle = "", // <- kommt aus primaryArtwork.title (falls vorhanden)
  imageUrl = "", // öffentlich + CORS, sonst wird nur Text geteilt
  utm = "utm_source=share&utm_medium=button&utm_campaign=auction",
  className = "",
  buttonLabel = "Share",
}) {
  const [open, setOpen] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  // Finaler Link mit UTM
  const shareUrl = useMemo(() => {
    if (!url) return "";
    return url.includes("?") ? `${url}&${utm}` : `${url}?${utm}`;
  }, [url, utm]);

  // Texte
  const message = useMemo(
    () => buildShareMessage({ artistName, artworkTitle, shareUrl }),
    [artistName, artworkTitle, shareUrl]
  );
  const caption = useMemo(
    () => buildCaption({ artistName, artworkTitle }),
    [artistName, artworkTitle]
  );

  // E-Mail-Betreff (ASCII & korrekt encodiert -> keine '+')
  const emailSubject = useMemo(() => {
    const base = artistName
      ? `${artistName} on popAUC${artworkTitle ? ` - "${artworkTitle}"` : ""}`
      : `popAUC${artworkTitle ? ` - "${artworkTitle}"` : ""}`;
    return sanitizeSubject(base);
  }, [artistName, artworkTitle]);

  const mailtoHref = useMemo(
    () => buildMailtoHref({ subject: emailSubject, body: message }),
    [emailSubject, message]
  );

  /** Native Share: Bild+Text+Link (wo unterstützt), sonst Text+Link, sonst Copy */
  async function onNativeShare() {
    if (imageUrl) {
      try {
        const res = await fetch(imageUrl, { credentials: "omit" });
        const blob = await res.blob();
        const filename = imageUrl.split("/").pop() || "image.jpg";
        const type = blob.type || "image/jpeg";
        const file = new File([blob], filename, { type });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: artworkTitle || artistName || "popAUC",
            text: message,
            url: shareUrl,
            files: [file],
          });
          return;
        }
      } catch {
        /* fall back to text share */
      }
    }
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
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 1500);
    } catch {
      window.prompt("Copy this message", message);
    }
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(caption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 1500);
    } catch {
      window.prompt("Copy this caption", caption);
    }
  }

  async function downloadImage() {
    if (!imageUrl) return;
    try {
      const res = await fetch(imageUrl, { credentials: "omit" });
      const blob = await res.blob();
      const filename = imageUrl.split("/").pop() || "image.jpg";
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } catch {
      /* ignore */
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
    { key: "email", label: "E-mail", href: mailtoHref }, // robustes mailto
  ];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Native Share */}
      <button
        onClick={onNativeShare}
        className="rounded-xl px-3 py-2 border border-buttonPink bg-greenButton/40 hover:bg-lightRedButton/40 transition text-sm"
        aria-label="Share"
        title="Share"
        type="button"
      >
        {buttonLabel}
      </button>

      {/* Fallback-Menü */}
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
              {copiedMsg ? "Message copied ✓" : "Copy message"}
            </button>

            {imageUrl && (
              <button
                onClick={downloadImage}
                role="menuitem"
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100/20 text-sm"
                type="button"
              >
                Download image
              </button>
            )}

            <button
              onClick={copyCaption}
              role="menuitem"
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100/20 text-sm"
              type="button"
            >
              {copiedCaption ? "Caption copied ✓" : "Copy caption"}
            </button>

            <div className="px-3 pb-2 pt-1 text-xs opacity-60">
              Instagram: save the image, create a Post/Story, then paste the
              caption. On mobile, try the Share button and pick Instagram.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
