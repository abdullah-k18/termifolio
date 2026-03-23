import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const BUCKET = "bg-cache";

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const arrayBuffer = await req.arrayBuffer();
  const hash = createHash("sha256").update(Buffer.from(arrayBuffer)).digest("hex");
  const path = `${hash}.png`;

  // Skip upload if already cached
  const { data: existing } = await supabase.storage.from(BUCKET).download(path);
  if (existing) {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, cached: true });
  }

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, { contentType: "image/png", upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, cached: false });
}
