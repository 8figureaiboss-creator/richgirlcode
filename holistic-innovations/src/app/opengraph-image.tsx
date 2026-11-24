import { ImageResponse } from "next/og";

export const alt = "Holistic Innovations LLC | Holistic Wellness for Women";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const petal = "M100 134 C 70 110, 72 64, 100 30 C 128 64, 130 110, 100 134 Z";

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", background: "linear-gradient(135deg, #fffaf7 0%, #fbeef2 55%, #f3cad7 100%)", padding: 80 }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 22, letterSpacing: 6, color: "#e86b9d", fontWeight: 700 }}>HOLISTIC WELLNESS FOR WOMEN</div>
          <div style={{ fontSize: 76, color: "#0b3f41", marginTop: 24, lineHeight: 1.05, fontWeight: 600 }}>Holistic Innovations</div>
          <div style={{ fontSize: 32, color: "#168e91", marginTop: 28, lineHeight: 1.35, maxWidth: 640 }}>
            Overnight newborn care, postpartum & lactation support across Sacramento and the Bay Area.
          </div>
        </div>
        <svg width="380" height="380" viewBox="0 0 200 200">
          <path d="M34 152 A 74 74 0 1 1 166 152" fill="none" stroke="#168e91" strokeWidth="4" strokeLinecap="round" />
          {[-62, -34, 34, 62].map((r) => <path key={r} d={petal} fill="#f3cad7" transform={`rotate(${r} 100 134)`} />)}
          {[-17, 17, 0].map((r) => <path key={r} d={petal} fill="#e86b9d" stroke="#fff" strokeWidth="1" transform={`rotate(${r} 100 134)`} />)}
          <path d="M56 144 Q 100 160 144 144" fill="none" stroke="#168e91" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
    ),
    size,
  );
}
