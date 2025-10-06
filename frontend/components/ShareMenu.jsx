import { useState, useMemo } from "react";

function enc(s) {
  return encodeURIComponent(s);
}

export default function ShareMenu({
  title,
  url,
  summary = "",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    const utm = "utm_source=share&utm_medium=button&utm_campaign=auction";
    return url.includes("?") ? `${url}&${utm}` : `${url}?${utm}`;
  }, [url]);

  const text = summary || title;

  async function onNativeShare() {
    const data = { title, text, url: shareUrl };
    try {
      if (navigator.share) {
        await navigator.share(data);
      } else {
        await copyLink();
      }
    } catch (e) {
      /* ignore */
    }
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // letzter Fallback
      window.prompt("Copy this URL", shareUrl);
    }
  }

  const links = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/?text=${enc(`${text} ${shareUrl}`)}`,
    },
    {
      key: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}`,
    },

    {
      key: "telegram",
      label: "Telegram",
      href: `https://t.me/share/url?url=${enc(shareUrl)}&text=${enc(text)}`,
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
      label: "E-Mail",
      href: `mailto:?subject=${enc(title)}&body=${enc(
        `${text}\n\n${shareUrl}`
      )}`,
    },
  ];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* 1) Native Share (beste UX auf Mobilgeräten) */}
      <button
        onClick={onNativeShare}
        className="rounded-xl px-3 py-2 border border-buttonPink  bg-greenButton/40 hover:bg-lightRedButton/40  transition text-sm"
        aria-label="Teilen"
        title="Teilen"
      >
        Teilen
      </button>

      {/* 2) Fallback-Menü mit klassischen Share-Links */}
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-xl px-3 py-2 border border-buttonPink bg-greenButton/40 hover:bg-lightRedButton/40  transition text-sm"
          aria-haspopup="menu"
          aria-expanded={open}
          title="Weitere Optionen"
        >
          ⋯
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
                className="block px-3 py-2 rounded-xl hover:bg-gray-100 text-sm"
              >
                {l.label}
              </a>
            ))}

            <button
              onClick={copyLink}
              role="menuitem"
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 text-sm"
            >
              {copied ? "Link kopiert ✓" : "Link kopieren"}
            </button>

            <div className="px-3 pb-2 pt-1 text-xs text-gray-500"></div>
          </div>
        )}
      </div>
    </div>
  );
}
