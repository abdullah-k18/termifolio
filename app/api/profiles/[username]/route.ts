import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/profiles";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const profile = await getProfile(username);

  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  return NextResponse.json(profile);
}
