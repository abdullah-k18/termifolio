import { NextRequest, NextResponse } from "next/server";
import { createProfile, usernameExists } from "@/lib/profiles";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, username, about, skills, email, phone, social_links, ascii_art } = body as {
    name?: string;
    username?: string;
    about?: string;
    skills?: string[];
    email?: string;
    phone?: string;
    social_links?: Record<string, string>;
    ascii_art?: string;
  };

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!username?.trim()) {
    return NextResponse.json({ error: "Username is required." }, { status: 400 });
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return NextResponse.json(
      { error: "Username can only contain letters, numbers, - and _" },
      { status: 400 }
    );
  }
  if (await usernameExists(username)) {
    return NextResponse.json(
      { error: "Username already taken." },
      { status: 409 }
    );
  }

  try {
  const profile = await createProfile({
    name: name.trim(),
    username: username.trim().toLowerCase(),
    about: (about ?? "").trim(),
    skills: Array.isArray(skills) ? skills : [],
    email: (email ?? "").trim(),
    phone: (phone ?? "").trim(),
    social_links: social_links ?? {},
    ascii_art: ascii_art ?? "",
  });
  return NextResponse.json(profile, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create profile.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
