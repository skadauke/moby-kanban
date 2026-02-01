"use client";

export function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Header skeleton */}
      <div className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-800 rounded-full animate-pulse" />
              <div>
                <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse mb-1" />
                <div className="h-3 w-40 bg-zinc-800 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-9 w-28 bg-zinc-800 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-20 bg-zinc-800 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Board skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        {[1, 2, 3].map((col) => (
          <div
            key={col}
            className="bg-zinc-950 rounded-lg border-t-4 border-zinc-600 min-h-[500px]"
          >
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="h-5 w-24 bg-zinc-800 rounded animate-pulse" />
                <div className="h-5 w-8 bg-zinc-800 rounded-full animate-pulse" />
              </div>
            </div>
            <div className="p-2 space-y-2">
              {[1, 2].map((card) => (
                <div
                  key={card}
                  className="bg-zinc-900 rounded-lg p-3 border border-zinc-800"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-6 w-6 bg-zinc-800 rounded animate-pulse" />
                    <div className="h-6 w-6 bg-zinc-800 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-3/4 bg-zinc-800 rounded animate-pulse mb-2" />
                  <div className="h-3 w-full bg-zinc-800 rounded animate-pulse mb-2" />
                  <div className="h-5 w-16 bg-zinc-800 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
