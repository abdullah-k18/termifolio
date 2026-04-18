"use client";

import { useState, useRef, useCallback, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";

// 10 visually distinct chars at small font sizes (dark → light)
const ASCII_CHARS = "@#%*+=-:. ";

function imageToAscii(img: HTMLImageElement, width = 100): string {
  // 0.45 corrects for chars being taller than wide
  const height = Math.round(width * 0.45 * (img.naturalHeight / img.naturalWidth));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height).data;

  const last = ASCII_CHARS.length - 1;
  const c = 0.5;
  const contrastMul = (259 * (c * 255 + 255)) / (255 * (259 - c * 255));

  let ascii = "";
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = (y * width + x) * 4;
      const alpha = data[p + 3] / 255;
      // Composite against white so transparent pixels (bg-removed) become spaces
      const r = data[p] * alpha + 255 * (1 - alpha);
      const g = data[p + 1] * alpha + 255 * (1 - alpha);
      const b = data[p + 2] * alpha + 255 * (1 - alpha);
      const luma = r * 0.2126 + g * 0.7152 + b * 0.0722;
      const contrasted = Math.min(255, Math.max(0, contrastMul * (luma - 128) + 128));
      ascii += ASCII_CHARS[Math.floor((contrasted / 255) * last)];
    }
    ascii += "\n";
  }
  return ascii;
}

function SectionHeading({ label }: { label: string }) {
  return (
    <p className="text-[var(--green)] text-xs tracking-widest mt-4 mb-1">
      ── {label} {"─".repeat(Math.max(0, 28 - label.length))}
    </p>
  );
}

interface FormData {
  name: string;
  username: string;
  about: string;
  email: string;
  phone: string;
  github: string;
  linkedin: string;
  twitter: string;
}

export default function CreatePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [asciiArt, setAsciiArt] = useState("");
  const [form, setForm] = useState<FormData>({
    name: "",
    username: "",
    about: "",
    email: "",
    phone: "",
    github: "",
    linkedin: "",
    twitter: "",
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [otherLinks, setOtherLinks] = useState<{ name: string; url: string }[]>([]);
  const [otherLinkName, setOtherLinkName] = useState("");
  const [otherLinkUrl, setOtherLinkUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "preview" | "done">("form");
  const [createdUsername, setCreatedUsername] = useState("");

  const handleImageUpload = useCallback((file: File) => {
    setAsciiArt("");
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setAsciiArt(imageToAscii(img));
    img.src = url;
  }, []);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) {
      handleImageUpload(file);
    }
  };

  const handleChange = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const isValidUrl = (url: string) =>
    !url || url.startsWith("https://") || url.startsWith("http://");

  const urlError = (label: string, url: string) =>
    url && !isValidUrl(url) ? `${label} must start with https://` : "";

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) setSkills((prev) => [...prev, s]);
    setSkillInput("");
  };

  const removeSkill = (idx: number) =>
    setSkills((prev) => prev.filter((_, i) => i !== idx));

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); addSkill(); }
    if (e.key === "Backspace" && !skillInput && skills.length)
      setSkills((prev) => prev.slice(0, -1));
  };

  const handlePreview = () => {
    setError("");
    if (!form.name.trim()) return setError("Name is required.");
    if (!form.username.trim()) return setError("Username is required.");
    if (!/^[a-zA-Z0-9_-]+$/.test(form.username))
      return setError("Username can only contain letters, numbers, - and _");
    setStep("preview");
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    const socialLinks: Record<string, string> = {};
    if (form.github) socialLinks.github = form.github;
    if (form.linkedin) socialLinks.linkedin = form.linkedin;
    if (form.twitter) socialLinks.twitter = form.twitter;
    otherLinks.forEach(({ name, url }) => { if (url) socialLinks[name] = url; });

    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          username: form.username.trim().toLowerCase(),
          about: form.about.trim(),
          skills,
          email: form.email.trim(),
          phone: form.phone.trim(),
          social_links: socialLinks,
          ascii_art: asciiArt,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); setSubmitting(false); return; }
      setCreatedUsername(data.username);
      setStep("done");
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  };

  // ── DONE ─────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="terminal-screen min-h-screen p-8 md:p-16">
        <div className="scanline" />
        <div className="max-w-2xl mx-auto space-y-4">
          <p className="text-[var(--green)]">✓ Profile created successfully!</p>
          <p className="text-[var(--gray)]">Your terminal portfolio is live at:</p>
          <div className="border border-[var(--green)] p-4">
            <span className="text-[var(--amber)] text-lg">/portfolio/{createdUsername}</span>
          </div>
          <div className="flex gap-4 pt-2">
            <button className="btn-green" onClick={() => router.push(`/portfolio/${createdUsername}`)}>
              View Profile →
            </button>
            <button className="btn-green opacity-60" onClick={() =>
              navigator.clipboard.writeText(`${window.location.origin}/portfolio/${createdUsername}`)
            }>
              Copy Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PREVIEW ───────────────────────────────────────────────────────────
  if (step === "preview") {
    const socialEntries = Object.entries({
      github: form.github, linkedin: form.linkedin,
      twitter: form.twitter,
      ...Object.fromEntries(otherLinks.map(({ name, url }) => [name, url])),
    }).filter(([, v]) => v);

    return (
      <div className="terminal-screen min-h-screen p-6 md:p-10">
        <div className="scanline" />

        {/* Header */}
        <div className="max-w-5xl mx-auto mb-4 flex items-center justify-between">
          <span className="text-[var(--gray)] text-xs">── PREVIEW ─────────────────────────</span>
          <div className="flex gap-3">
            <button className="btn-green text-xs px-3 py-1" onClick={() => setStep("form")}>← Edit</button>
            <button className="btn-green text-xs px-3 py-1" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Creating..." : "Create Profile →"}
            </button>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm max-w-5xl mx-auto mb-3">{error}</p>}

        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6">

          {/* LEFT — ASCII art */}
          {asciiArt && (
            <div className="shrink-0">
              <pre
                style={{ fontSize: "6px", lineHeight: "1.1", letterSpacing: "0.04em", background: "#00ff00", color: "#000", padding: "4px", fontWeight: "normal" }}
                className="font-mono whitespace-pre"
              >
                {asciiArt}
              </pre>
            </div>
          )}

          {/* RIGHT — info */}
          <div className="flex-1 font-mono min-w-0">

            {/* Name — big styled */}
            <div className="mb-2">
              <p className="text-[var(--amber)] text-3xl md:text-4xl font-bold tracking-widest leading-none">
                {form.name.toUpperCase()}
              </p>
              <p className="text-[var(--gray)] text-xs mt-1 tracking-widest">
                @{form.username.toLowerCase()}
              </p>
            </div>

            {/* About */}
            {form.about && (
              <>
                <SectionHeading label="ABOUT" />
                <p className="text-[var(--white)] text-sm leading-relaxed">{form.about}</p>
              </>
            )}

            {/* Skills — ls style */}
            {skills.length > 0 && (
              <>
                <SectionHeading label="SKILLS" />
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {skills.map((s) => (
                    <span key={s} className="text-blue-400 text-sm">
                      {s}
                    </span>
                  ))}
                </div>
              </>
            )}

            {/* Contact */}
            {(form.email || form.phone) && (
              <>
                <SectionHeading label="CONTACT" />
                <div className="space-y-0.5 text-sm">
                  {form.email && (
                    <p>
                      <span className="text-[var(--gray)] w-16 inline-block">email</span>
                      <span className="text-[var(--white)]">{form.email}</span>
                    </p>
                  )}
                  {form.phone && (
                    <p>
                      <span className="text-[var(--gray)] w-16 inline-block">phone</span>
                      <span className="text-[var(--white)]">{form.phone}</span>
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Social */}
            {socialEntries.length > 0 && (
              <>
                <SectionHeading label="LINKS" />
                <div className="space-y-0.5 text-sm">
                  {socialEntries.map(([k, v]) => (
                    <p key={k}>
                      <span className="text-[var(--gray)] w-20 inline-block">{k}</span>
                      <span className="text-blue-400">{v}</span>
                    </p>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── FORM ──────────────────────────────────────────────────────────────
  return (
    <div className="terminal-screen min-h-screen p-8 md:p-16">
      <div className="scanline" />
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <p className="text-[var(--gray)] text-xs mb-1">
            ┌─[ CREATE PROFILE ]──────────────────────────────────────┐
          </p>
          <h1 className="text-[var(--green)] text-xl font-bold">./setup-terminal-portfolio</h1>
          <p className="text-[var(--gray)] text-sm mt-1">
            Fill in your details. Your profile will be accessible at{" "}
            <span className="text-[var(--amber)]">/portfolio/your-username</span>
          </p>
        </div>

        <div className="space-y-5">

          {/* Image Upload */}
          <div>
            <label className="text-[var(--green)] text-xs block mb-2">[01] PROFILE IMAGE → ASCII</label>
            <div
              className="border border-dashed border-[var(--green-dark)] p-6 text-center cursor-pointer hover:border-[var(--green)] transition-colors"
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              {asciiArt ? (
                <p className="text-[var(--gray)] text-xs">Click to change image</p>
              ) : (
                <div>
                  <p className="text-[var(--gray)]">Drop image here or click to upload</p>
                  <p className="text-[var(--gray)] text-xs mt-1">PNG, JPG, GIF supported</p>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
            {asciiArt && (
              <pre
                style={{ fontSize: "6px", lineHeight: "1.15", letterSpacing: "0.04em" }}
                className="text-[var(--green)] font-mono whitespace-pre mt-3"
              >
                {asciiArt}
              </pre>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="text-[var(--green)] text-xs block mb-1">
              [02] NAME <span className="text-red-400">*</span>
            </label>
            <input type="text" placeholder="John Doe" value={form.name} onChange={handleChange("name")} />
          </div>

          {/* Username */}
          <div>
            <label className="text-[var(--green)] text-xs block mb-1">
              [03] USERNAME <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[var(--gray)]">/portfolio/</span>
              <input type="text" placeholder="johndoe" value={form.username}
                onChange={handleChange("username")} className="flex-1" />
            </div>
          </div>

          {/* About */}
          <div>
            <label className="text-[var(--green)] text-xs block mb-1">[04] ABOUT</label>
            <textarea placeholder="I am a developer passionate about..." value={form.about}
              onChange={handleChange("about")} rows={3} className="resize-none" />
          </div>

          {/* Skills — tag input */}
          <div>
            <label className="text-[var(--green)] text-xs block mb-1">
              [05] SKILLS <span className="text-[var(--gray)]">(press Enter to add)</span>
            </label>
            {/* Tag display */}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-x-5 gap-y-1 mb-2 p-2 border border-[var(--green-dark)]">
                {skills.map((s, i) => (
                  <span key={i} className="text-blue-400 text-sm flex items-center gap-1 group">
                    {s}
                    <button
                      onClick={() => removeSkill(i)}
                      className="text-[var(--gray)] hover:text-red-400 text-xs leading-none"
                      title="remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. React"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                className="flex-1"
              />
              <button className="btn-green px-3" onClick={addSkill}>Add</button>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <label className="text-[var(--green)] text-xs block">[06] CONTACT</label>
            <input type="email" placeholder="Email" value={form.email} onChange={handleChange("email")} />
            <input type="tel" placeholder="Phone" value={form.phone} onChange={handleChange("phone")} />
          </div>

          {/* Social Links */}
          <div className="space-y-2">
            <label className="text-[var(--green)] text-xs block">[07] SOCIAL LINKS</label>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--gray)] w-20 shrink-0">github</span>
                <input type="url" placeholder="https://github.com/..." value={form.github} onChange={handleChange("github")} className="flex-1" />
              </div>
              {urlError("GitHub", form.github) && <p className="text-red-400 text-xs mt-0.5 ml-[5.5rem]">{urlError("GitHub", form.github)}</p>}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--gray)] w-20 shrink-0">linkedin</span>
                <input type="url" placeholder="https://linkedin.com/in/..." value={form.linkedin} onChange={handleChange("linkedin")} className="flex-1" />
              </div>
              {urlError("LinkedIn", form.linkedin) && <p className="text-red-400 text-xs mt-0.5 ml-[5.5rem]">{urlError("LinkedIn", form.linkedin)}</p>}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--gray)] w-20 shrink-0">twitter</span>
                <input type="url" placeholder="https://twitter.com/..." value={form.twitter} onChange={handleChange("twitter")} className="flex-1" />
              </div>
              {urlError("Twitter", form.twitter) && <p className="text-red-400 text-xs mt-0.5 ml-[5.5rem]">{urlError("Twitter", form.twitter)}</p>}
            </div>

            {/* Custom named links */}
            <p className="text-[var(--gray)] text-xs pt-1">Other links</p>
            {otherLinks.length > 0 && (
              <div className="space-y-1 border border-[var(--green-dark)] p-2">
                {otherLinks.map((l, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-[var(--green)] w-24 shrink-0 truncate">{l.name}</span>
                    <span className="text-[var(--gray)] flex-1 truncate">{l.url}</span>
                    <button onClick={() => setOtherLinks((prev) => prev.filter((_, j) => j !== i))}
                      className="text-[var(--gray)] hover:text-red-400 text-xs shrink-0">×</button>
                  </div>
                ))}
              </div>
            )}
            <input
              type="text"
              placeholder="Label (e.g. Portfolio)"
              value={otherLinkName}
              onChange={(e) => setOtherLinkName(e.target.value)}
            />
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://..."
                value={otherLinkUrl}
                onChange={(e) => setOtherLinkUrl(e.target.value)}
                className="flex-1"
              />
              <button className="btn-green px-3 shrink-0" onClick={() => {
                const name = otherLinkName.trim();
                const url = otherLinkUrl.trim();
                if (!name || !url) return;
                if (!isValidUrl(url)) return;
                setOtherLinks((prev) => [...prev, { name, url }]);
                setOtherLinkName("");
                setOtherLinkUrl("");
              }}>Add</button>
            </div>
            {urlError("URL", otherLinkUrl) && <p className="text-red-400 text-xs">{urlError("URL", otherLinkUrl)}</p>}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="pt-2">
            <button className="btn-green w-full" onClick={handlePreview}>Preview Profile →</button>
          </div>
        </div>

        <p className="text-[var(--gray)] text-xs mt-6">
          └──────────────────────────────────────────────────────────┘
        </p>
      </div>
    </div>
  );
}
