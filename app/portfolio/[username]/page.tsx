"use client";
import dynamic from "next/dynamic";

// Disable SSR — this page is fully interactive client-side.
// Prevents hydration mismatches from stale server renders.
const ProfilePage = dynamic(() => import("./_client"), {
  ssr: false,
  loading: () => (
    <div className="terminal-screen min-h-screen flex items-center justify-center">
      <span className="text-[var(--green)]">
        Loading<span className="cursor" />
      </span>
    </div>
  ),
});

export default function Page({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  return <ProfilePage params={params} />;
}
