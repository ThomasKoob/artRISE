import { useState, useMemo } from "react";

/** Helpers */
const enc = encodeURIComponent;
const NL = "\n";

/** Einheitliche Message für alle Kanäle */
function buildShareMessage({ artistName, artworkTitle, shareUrl }) {
  const line1 = artistName
    ? `${artistName} is running a pop-up auction on popAUC`
    : `Pop-up auction on popAUC`;
  const line2 = artworkTitle ? `“${artworkTitle}”` : "";
  return [line1, line2, shareUrl].filter(Boolean).join(NL);
}

/** Instagram-taugliche Kurz-Caption (ohne Link) */
function buildCaption({ artistName, artworkTitle }) {
  const titleLine = artworkTitle ? `“${artworkTitle}”` : "";
  const artistLine = artistName
    ? `${artistName} — pop-up auction on popAUC`
    : `pop-up auction on popAUC`;
  return [titleLine, artistLine].filter(Boolean).join("\n");
}

export default function ShareMenu({
  url, // Pflicht: kanonische Auktions-URL (ohne UTM)
  artistName = "", // z. B. "xyc"
  artworkTitle = "", // z. B. "Untitled #3"
  imageUrl = "", // optional: öffentlich erreichbares Bild (Profil/Artwork), CORS!
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

  // Einheitliche Texte
  const message = useMemo(
    () => buildShareMessage({ artistName, artworkTitle, shareUrl }),
    [artistName, artworkTitle, shareUrl]
  );
  const caption = useMemo(
    () => buildCaption({ artistName, artworkTitle }),
    [artistName, artworkTitle]
  );

  /** Native Share: versucht Bild+Text+Link; sonst Text+Link; sonst Copy */
  async function onNativeShare() {
    // 1) Versuche Bild mitzuschicken (nur, wenn Browser Files im Share unterstützt)
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
        // Bild konnte nicht geladen/geteilt werden -> weiter mit Text+Link
      }
    }

    // 2) Text + Link
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
      // abgebrochen/ignoriert
    }
  }

  /** Vollständige Message (Text + Link) kopieren */
  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 1500);
    } catch {
      window.prompt("Copy this message", message);
    }
  }

  /** Nur Caption (für Instagram) kopieren */
  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(caption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 1500);
    } catch {
      window.prompt("Copy this caption", caption);
    }
  }

  /** Bild herunterladen (für Instagram-Flow: Bild speichern + Caption einfügen) */
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
      // optional: Fehlerbehandlung/Toast
    }
  }

  /** Kanalspezifische Links (FB/LinkedIn ignorieren Text und nutzen OG) */
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
      {/* 1) Native Share (beste UX mobil) */}
      <button
        onClick={onNativeShare}
        className="rounded-xl px-3 py-2 border border-buttonPink bg-greenButton/40 hover:bg-lightRedButton/40 transition text-sm"
        aria-label="Share"
        title="Share"
        type="button"
      >
        {buttonLabel}
      </button>

      {/* 2) Fallback-Menü */}
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
            {/* Klassische Share-Links */}
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

            {/* Copy Message */}
            <button
              onClick={copyMessage}
              role="menuitem"
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100/20 text-sm"
              type="button"
            >
              {copiedMsg ? "Message copied ✓" : "Copy message"}
            </button>

            {/* Instagram-Flow: Bild speichern + Caption kopieren */}
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

            {/* Hinweis */}
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
