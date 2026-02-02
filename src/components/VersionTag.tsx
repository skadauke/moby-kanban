"use client";

/**
 * Displays a subtle version tag in the corner of the app.
 * Shows commit hash and build time from environment variables.
 */
export function VersionTag() {
  const commitSha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev";
  const rawBuildTime = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();
  
  // Format as "Feb 2, 2026, 4:30 PM" for readability
  const buildTime = new Date(rawBuildTime).toLocaleString("en-US", {
    month: "short",
    day: "numeric", 
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="fixed bottom-2 right-2 text-[10px] text-zinc-600 font-mono select-none pointer-events-none z-50">
      {commitSha} · {buildTime}
    </div>
  );
}
