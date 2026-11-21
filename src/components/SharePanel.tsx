"use client";

import { useState } from "react";
import { BASE_PATH } from "@/lib/basePath";
import { isoDay, postText, reading, type Series, type Track, type Unit } from "@/lib/metrics";

export function SharePanel({ series, track, unit }: { series: Series; track: Track; unit: Unit }) {
  const [copied, setCopied] = useState(false);
  const text = postText(track, reading(series), unit);
  const src = `${BASE_PATH}/card/${track}/${unit}`;
  return (
    <div className="share">
      {/* eslint-disable-next-line @next/next/no-img-element -- a generated PNG served by this app */}
      <img src={src} width={1200} height={675} alt="Today's Fast Takeoff card" />
      <div>
        <div className="post">{text}</div>
        <div className="actions">
          <a href={src} download={`fasttakeoff-${track}-${isoDay(series.asOf)}.png`}>
            Download image
          </a>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "Copied" : "Copy post"}
          </button>
        </div>
      </div>
    </div>
  );
}
