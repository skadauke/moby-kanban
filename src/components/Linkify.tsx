"use client";

import { Fragment } from "react";

interface LinkifyProps {
  text: string;
  className?: string;
}

/**
 * Renders text with URLs converted to clickable links.
 * Matches http/https URLs and makes them clickable.
 */
export function Linkify({ text, className }: LinkifyProps) {
  // URL regex - matches http/https URLs
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;
  
  const parts = text.split(urlRegex);
  
  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (urlRegex.test(part)) {
          // Reset regex lastIndex since we're reusing it
          urlRegex.lastIndex = 0;
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-400 hover:text-blue-300 hover:underline"
            >
              {part.length > 50 ? part.slice(0, 47) + "..." : part}
            </a>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </span>
  );
}
