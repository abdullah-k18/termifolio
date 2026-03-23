"use client";

import { use, useEffect, useRef, useState } from "react";

interface Profile {
  name: string;
  username: string;
  ascii_art: string;
  about: string;
  skills: string[];
  email: string;
  phone: string;
  social_links: Record<string, string>;
}

interface TerminalLine {
  text?: string;
  type: "input" | "output" | "error" | "system" | "heading" | "skills-grid";
  items?: string[]; // used by skills-grid
}

/* ── command output builder ─────────────────────────────────────── */
function buildOutput(profile: Profile, cmd: string): TerminalLine[] {
  const c = cmd.trim().toLowerCase();

  if (c === "/help") {
    return [
      { type: "heading", text: "COMMANDS" },
      { type: "output", text: "  /about    → Show about section" },
      { type: "output", text: "  /skills   → Show skills" },
      { type: "output", text: "  /contact  → Show contact info" },
      { type: "output", text: "  /social   → Show social links" },
      { type: "output", text: "  /all      → Show everything" },
      { type: "output", text: "  /clear    → Clear terminal" },
      { type: "output", text: "  /help     → Show this help" },
    ];
  }

  if (c === "/about") {
    return [
      { type: "heading", text: "ABOUT" },
      { type: "output", text: profile.about || "(no about provided)" },
    ];
  }

  if (c === "/skills") {
    if (!profile.skills?.length) return [{ type: "output", text: "No skills listed." }];
    return [
      { type: "heading", text: "SKILLS" },
      { type: "skills-grid", items: profile.skills },
    ];
  }

  if (c === "/contact") {
    const lines: TerminalLine[] = [{ type: "heading", text: "CONTACT" }];
    if (profile.email) lines.push({ type: "output", text: `  ${"email".padEnd(10)} ${profile.email}` });
    if (profile.phone) lines.push({ type: "output", text: `  ${"phone".padEnd(10)} ${profile.phone}` });
    if (!profile.email && !profile.phone) lines.push({ type: "output", text: "No contact info provided." });
    return lines;
  }

  if (c === "/social") {
    const entries = Object.entries(profile.social_links ?? {}).filter(([, v]) => v);
    if (!entries.length) return [{ type: "output", text: "No social links provided." }];
    return [
      { type: "heading", text: "LINKS" },
      ...entries.map(([k, v]) => ({ type: "output" as const, text: `  ${k.padEnd(10)} ${v}` })),
    ];
  }

  if (c === "/all") {
    const lines: TerminalLine[] = [];

    lines.push({ type: "heading", text: "ABOUT" });
    lines.push({ type: "output", text: profile.about || "(none)" });

    if (profile.skills?.length) {
      lines.push({ type: "heading", text: "SKILLS" });
      lines.push({ type: "skills-grid", items: profile.skills });
    }

    const hasContact = profile.email || profile.phone;
    if (hasContact) {
      lines.push({ type: "heading", text: "CONTACT" });
      if (profile.email) lines.push({ type: "output", text: `  ${"email".padEnd(10)} ${profile.email}` });
      if (profile.phone) lines.push({ type: "output", text: `  ${"phone".padEnd(10)} ${profile.phone}` });
    }

    const entries = Object.entries(profile.social_links ?? {}).filter(([, v]) => v);
    if (entries.length) {
      lines.push({ type: "heading", text: "LINKS" });
      entries.forEach(([k, v]) => lines.push({ type: "output", text: `  ${k.padEnd(10)} ${v}` }));
    }

    return lines;
  }

  if (c === "/clear") return [{ type: "system", text: "__CLEAR__" }];

  return [
    { type: "error", text: `Command not found: ${cmd}` },
    { type: "error", text: `Type /help to see available commands.` },
  ];
}

/* ── component ──────────────────────────────────────────────────── */
export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [input, setInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [bootDone, setBootDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* fetch profile */
  useEffect(() => {
    fetch(`/api/profiles/${username}`)
      .then((r) => { if (r.status === 404) { setNotFound(true); setLoading(false); return null; } return r.json(); })
      .then((data) => { if (data) { setProfile(data); setLoading(false); } })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [username]);

  /* boot animation */
  useEffect(() => {
    if (!profile) return;

    const boot: TerminalLine[] = [
      { type: "system", text: `Connecting to @${profile.username}...` },
      { type: "system", text: `Profile loaded. Type /help to explore.` },
      { type: "system", text: "" },
    ];

    let i = 0;
    const iv = setInterval(() => {
      if (i < boot.length) {
        const line = boot[i];
        setLines((prev) => [...prev, line]);
        i++;
      } else {
        clearInterval(iv);
        setBootDone(true);
      }
    }, 120);

    return () => clearInterval(iv);
  }, [profile]);

  /* auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const handleCommand = () => {
    const cmd = input.trim();
    if (!cmd || !profile) return;

    setCmdHistory((prev) => [cmd, ...prev]);
    setHistoryIdx(-1);

    const output = buildOutput(profile, cmd);

    if (output[0]?.text === "__CLEAR__") {
      setLines([]);
      setInput("");
      return;
    }

    setLines((prev) => [
      ...prev,
      { type: "input", text: `> ${cmd}` },
      ...output,
      { type: "system", text: "" },
    ]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { handleCommand(); }
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      const idx = Math.min(historyIdx + 1, cmdHistory.length - 1);
      setHistoryIdx(idx);
      setInput(cmdHistory[idx] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const idx = Math.max(historyIdx - 1, -1);
      setHistoryIdx(idx);
      setInput(idx === -1 ? "" : cmdHistory[idx] ?? "");
    }
  };

  /* ── render helpers ── */
  const renderLine = (line: TerminalLine, i: number) => {
    if (line.type === "skills-grid") {
      return (
        <div key={i} className="flex flex-wrap gap-x-6 gap-y-1 py-0.5">
          {line.items?.map((s) => (
            <span key={s} className="text-blue-400 font-mono">{s}</span>
          ))}
        </div>
      );
    }
    if (!line.text) return <div key={i} className="h-2" />;
    if (line.type === "heading") {
      return (
        <div key={i} className="text-[var(--amber)] text-xs tracking-widest mt-3 mb-1">
          ── {line.text} {"─".repeat(Math.max(0, 30 - line.text.length))}
        </div>
      );
    }
    if (line.type === "input") return <div key={i} className="text-[var(--amber)]">{line.text}</div>;
    if (line.type === "error") return <div key={i} className="text-red-400">{line.text}</div>;
    if (line.type === "system") return <div key={i} className="text-[var(--gray)]">{line.text}</div>;
    return <div key={i} className="text-[var(--white)]">{line.text}</div>;
  };

  /* ── loading / 404 ── */
  if (loading) {
    return (
      <div className="terminal-screen min-h-screen flex items-center justify-center">
        <span className="text-[var(--green)]">Loading<span className="cursor" /></span>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="terminal-screen min-h-screen p-8">
        <p className="text-[var(--green)]">&gt; Error 404</p>
        <p className="text-red-400 mt-1">Profile not found: @{username}</p>
        <p className="text-[var(--gray)] mt-2">
          Create yours at <a href="/create" className="text-[var(--green)] underline">/create</a>
        </p>
      </div>
    );
  }

  const socialEntries = Object.entries(profile?.social_links ?? {}).filter(([, v]) => v);

  /* ── main layout ── */
  return (
    <div className="terminal-screen min-h-screen flex flex-col md:flex-row" onClick={() => inputRef.current?.focus()}>
      <div className="scanline" />

      {/* ── LEFT SIDEBAR ── */}
      <aside className="md:w-72 shrink-0 border-b md:border-b-0 md:border-r border-[var(--green-dark)] flex flex-col p-4 gap-3">

        {/* ASCII art */}
        {profile?.ascii_art && (
          <pre
            style={{ fontSize: "5.5px", lineHeight: "1.15", letterSpacing: "0.04em" }}
            className="text-[var(--green)] font-mono whitespace-pre overflow-hidden"
          >
            {profile.ascii_art}
          </pre>
        )}

        {/* Name + username */}
        <div className="border-t border-[var(--green-dark)] pt-3">
          <p className="text-[var(--green)] text-xl font-bold tracking-widest leading-tight">
            {profile?.name?.toUpperCase()}
          </p>
          <p className="text-[var(--amber)] text-xs tracking-widest mt-0.5">@{profile?.username}</p>
        </div>

        {/* Quick stats */}
        <div className="text-xs space-y-1 border-t border-[var(--green-dark)] pt-3">
          {profile?.skills?.length ? (
            <p className="text-[var(--gray)]">
              <span className="text-[var(--green)]">{profile.skills.length}</span> skills
            </p>
          ) : null}
          {profile?.email && (
            <p className="text-[var(--gray)] truncate">
              <span className="text-[var(--green)]">✉ </span>{profile.email}
            </p>
          )}
          {socialEntries.map(([k, v]) => (
            <p key={k} className="text-[var(--gray)] truncate">
              <span className="text-[var(--green)]">{k[0].toUpperCase() + k.slice(1)} </span>
              <a href={v} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate">
                {v.replace(/^https?:\/\//, "")}
              </a>
            </p>
          ))}
        </div>

        {/* Quick command hints */}
        <div className="mt-auto border-t border-[var(--green-dark)] pt-3 hidden md:block">
          <p className="text-[var(--gray)] text-xs mb-1">quick commands</p>
          {["/about", "/skills", "/contact", "/all"].map((cmd) => (
            <button
              key={cmd}
              onClick={(e) => { e.stopPropagation(); setInput(cmd); inputRef.current?.focus(); }}
              className="block text-left text-[var(--green)] text-xs hover:text-[var(--amber)] transition-colors w-full"
            >
              {cmd}
            </button>
          ))}
        </div>
      </aside>

      {/* ── RIGHT: TERMINAL ── */}
      <div className="flex-1 flex flex-col min-h-0">

        {/* topbar */}
        <div className="border-b border-[var(--green-dark)] px-4 py-2 flex items-center gap-2 text-xs text-[var(--gray)] shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--green)] inline-block" />
          <span>terminal</span>
          <span className="mx-1">—</span>
          <span>@{username}</span>
        </div>

        {/* output */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 font-mono text-sm">
          {lines.map((line, i) => renderLine(line, i))}
          <div ref={bottomRef} />
        </div>

        {/* input */}
        {bootDone && (
          <div className="border-t border-[var(--green-dark)] px-4 py-3 flex items-center gap-2 shrink-0">
            <span className="text-[var(--amber)]">&gt;</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-[var(--green)] font-mono caret-[var(--green)]"
              autoFocus
              spellCheck={false}
              autoComplete="off"
              placeholder="type a command..."
            />
          </div>
        )}
      </div>
    </div>
  );
}
