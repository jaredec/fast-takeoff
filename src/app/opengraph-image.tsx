import { ImageResponse } from "next/og";

export const alt = "What did AI do today?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: "#fff",
          color: "#111",
        }}
      >
        <svg width={68} height={68} viewBox="0 0 24 24">
          <path
            d="M12.6 1.8Q15.4 10.8 19.2 21.2Q10.2 16.4 2.2 9.8Q12.4 10.6 22 8.4Q13.2 15.6 4.8 20.6Q8.4 10.4 13.4 1.2"
            fill="none"
            stroke="#111"
            strokeWidth={1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div style={{ fontSize: 60, letterSpacing: -1.5 }}>What did AI do today?</div>
      </div>
    ),
    size,
  );
}
