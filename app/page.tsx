"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const BOOT_LINES = [
  "TermiFolio OS v1.0.0",
  "Copyright (c) 2026 TermiFolio",
  "",
  "Initializing kernel...",
  "Loading modules... OK",
  "Mounting filesystem... OK",
  "Starting network... OK",
  "",
  "> Welcome to TermiFolio.",
  "> Your identity, but in terminal.",
  "",
];

export default function Home() {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [showLinks, setShowLinks] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < BOOT_LINES.length) {
        setVisibleLines((prev) => [...prev, BOOT_LINES[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setShowLinks(true), 300);
      }
    }, 120);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="terminal-screen min-h-screen p-8 md:p-16">
      <div className="scanline" />
      <div className="max-w-2xl mx-auto">
        <div className="mb-2 text-[var(--gray)] text-xs">
          ┌─[ TERMIFOLIO ]──────────────────────────────────────────┐
        </div>

        <div className="space-y-0 mb-6">
          {visibleLines.map((line, i) => (
            <div key={i} className={line === "" ? "h-4" : "text-[var(--green)]"}>
              {line}
            </div>
          ))}
          {!showLinks && visibleLines.length > 0 && (
            <span className="cursor" />
          )}
        </div>

        {showLinks && (
          <div className="space-y-6 animate-fade-in">
            <div className="border border-[var(--green-dark)] p-6">
              <p className="text-[var(--green)] mb-1">
                <span className="text-[var(--gray)]">$</span> cat tagline.txt
              </p>
              <p className="text-[var(--amber)] text-lg font-bold mb-4">
                "Not a website. A terminal."
              </p>
              <p className="text-[var(--white)] text-sm leading-relaxed">
                Upload your photo, convert it to ASCII art, fill in your
                details, and get a shareable terminal-style portfolio URL.
                Visitors explore your profile using real terminal commands.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[var(--gray)] text-xs">
                Available commands:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  href="/create"
                  className="block border border-[var(--green)] p-4 hover:bg-[var(--green-dark)] transition-colors group"
                >
                  <span className="text-[var(--green)] font-bold">
                    ./create-profile
                  </span>
                  <p className="text-[var(--gray)] text-xs mt-1">
                    Build your terminal portfolio
                  </p>
                </Link>

                <div className="border border-[var(--green-dark)] p-4 opacity-60">
                  <span className="text-[var(--gray)] font-bold">
                    /portfolio/&lt;username&gt;
                  </span>
                  <p className="text-[var(--gray)] text-xs mt-1">
                    View any portfolio by URL
                  </p>
                </div>
              </div>
            </div>

            <div className="text-[var(--gray)] text-xs border-t border-[var(--green-dark)] pt-4">
              <p>
                <span className="text-[var(--green)]">tip:</span> visit{" "}
                <span className="text-[var(--amber)]">/portfolio/your-username</span>{" "}
                after creating your profile
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[var(--gray)]">$</span>
              <span className="text-[var(--green)]">_</span>
              <span className="cursor" />
            </div>
          </div>
        )}

        <div className="mt-8 text-[var(--gray)] text-xs">
          └──────────────────────────────────────────────────────────┘
        </div>
      </div>
    </div>
  );
}
