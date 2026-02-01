"use client";

/**
 * Displays a subtle version tag in the corner of the app.
 * Shows commit hash and build time from environment variables.
 */
export function VersionTag() {
  const commitSha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev";
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString().slice(0, 10);

  return (
    <div className="fixed bottom-2 right-2 text-[10px] text-zinc-600 font-mono select-none pointer-events-none">
      {commitSha} · {buildTime}
    </div>
  );
}
